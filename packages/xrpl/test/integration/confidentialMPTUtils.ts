import { decryptAmount } from '@xrplf/mpt-crypto'
import { assert } from 'chai'

import { Client, Wallet, type TransactionMetadata } from '../../src'
import {
  deriveConfidentialKeypair,
  fetchMPToken,
  getConfidentialBalance,
  prepareConfidentialConvert,
  prepareConfidentialMergeInbox,
  type ConfidentialKeypair,
} from '../../src/confidential'
import {
  MPTokenIssuanceCreate,
  MPTokenIssuanceSet,
  Payment,
} from '../../src/models/transactions'

import serverUrl from './serverUrl'
import { generateFundedWallet, testTransaction } from './utils'

/*
 * Shared helpers for the Confidential MPT (XLS-0096) integration tests. They run
 * against a rippled with the MPTokensV1 + Clawback + ConfidentialTransfer
 * amendments enabled (a local standalone for now; a CI docker image later), and
 * reuse the standard harness (`testTransaction` drives autofill + sign + submit +
 * `ledger_accept` + verify; `generateFundedWallet` funds from the genesis account).
 */

export interface ConfidentialContext {
  client: Client
}

export interface Holder {
  wallet: Wallet
  key: ConfidentialKeypair
}

/**
 * Connect to a confidential-capable rippled. PR #5860 builds omit `network_id`
 * from `server_info`, which makes `client.connect()` reject on current xrpl.js
 * even though the socket is open; tolerate that and pin `networkID = 0`. (Once
 * the CI image reports `network_id`, this can use the standard `setupClient`.)
 *
 * @param server - The WebSocket URL (defaults to the shared `serverUrl`).
 * @returns A connected confidential test context.
 */
export async function setupConfidentialClient(
  server = serverUrl,
): Promise<ConfidentialContext> {
  const client = new Client(server, { timeout: 200000 })
  try {
    await client.connect()
  } catch {
    // PR #5860 build omits network_id; the socket is still open.
  }
  client.networkID = 0
  assert.isTrue(client.isConnected(), 'confidential rippled connection is open')
  return { client }
}

/**
 * Disconnect a confidential test context.
 *
 * @param context - The context to tear down.
 */
export async function teardownConfidential(
  context: ConfidentialContext,
): Promise<void> {
  context.client.removeAllListeners()
  await context.client.disconnect()
}

/**
 * Create a confidential-capable, lockable MPT issuance and register the issuer
 * (and, optionally, auditor) ElGamal encryption keys.
 *
 * `tfMPTCanLock` makes the issuance modifiable via MPTokenIssuanceSet without
 * the DynamicMPT/SingleAssetVault amendment (rippled MPTokenIssuanceSet guard);
 * the issuer + auditor keys must be registered together in one Set.
 *
 * @param client - A connected client.
 * @param issuer - The issuer wallet.
 * @param issuerKey - The issuer ElGamal keypair.
 * @param auditorKey - An optional auditor ElGamal keypair to register.
 * @param requireAuth - Create the issuance with RequireAuth (the issuer must
 *   authorize each holder before it can hold the token). Defaults to false.
 * @returns The new MPTokenIssuanceID.
 */
// eslint-disable-next-line max-params -- setup tuple (+ optional auditorKey, requireAuth)
export async function createConfidentialIssuance(
  client: Client,
  issuer: Wallet,
  issuerKey: ConfidentialKeypair,
  auditorKey?: ConfidentialKeypair,
  requireAuth = false,
): Promise<string> {
  const createTx: MPTokenIssuanceCreate = {
    TransactionType: 'MPTokenIssuanceCreate',
    Account: issuer.classicAddress,
    MaximumAmount: '9223372036854775807',
    AssetScale: 0,
    Flags: {
      tfMPTCanLock: true,
      tfMPTCanTransfer: true,
      tfMPTCanClawback: true,
      tfMPTCanHoldConfidentialBalance: true,
      ...(requireAuth ? { tfMPTRequireAuth: true } : {}),
    },
  }
  const created = await testTransaction(client, createTx, issuer)
  const txResp = await client.request({
    command: 'tx',
    transaction: created.result.tx_json.hash,
  })
  const meta = txResp.result.meta as TransactionMetadata<MPTokenIssuanceCreate>
  const mptID = meta.mpt_issuance_id
  if (mptID == null) {
    throw new Error('MPTokenIssuanceCreate did not return an mpt_issuance_id')
  }

  const setTx: MPTokenIssuanceSet = {
    TransactionType: 'MPTokenIssuanceSet',
    Account: issuer.classicAddress,
    MPTokenIssuanceID: mptID,
    IssuerEncryptionKey: issuerKey.publicKey,
  }
  if (auditorKey != null) {
    setTx.AuditorEncryptionKey = auditorKey.publicKey
  }
  await testTransaction(client, setTx, issuer)
  return mptID
}

/**
 * Fund a fresh holder, generate its ElGamal key, and opt it into the issuance.
 *
 * @param client - A connected client.
 * @param mptID - The MPTokenIssuanceID.
 * @returns The holder wallet and a fresh ElGamal keypair.
 */
export async function setupHolder(
  client: Client,
  mptID: string,
): Promise<Holder> {
  const wallet = await generateFundedWallet(client)
  const key = deriveConfidentialKeypair()
  await testTransaction(
    client,
    {
      TransactionType: 'MPTokenAuthorize',
      Account: wallet.classicAddress,
      MPTokenIssuanceID: mptID,
    },
    wallet,
  )
  return { wallet, key }
}

/**
 * Register a holder's encryption key via a zero-amount convert (no balance).
 *
 * @param client - A connected client.
 * @param mptID - The MPTokenIssuanceID.
 * @returns The registered holder.
 */
export async function registerHolderKey(
  client: Client,
  mptID: string,
): Promise<Holder> {
  const holder = await setupHolder(client, mptID)
  const convert = await prepareConfidentialConvert(client, {
    account: holder.wallet.classicAddress,
    amount: 0n,
    holder: holder.key,
    mptIssuanceID: mptID,
  })
  await testTransaction(client, convert, holder.wallet)
  return holder
}

/**
 * Give a fresh holder a spendable confidential balance: pay public MPT, then
 * convert and merge it into the spendable balance.
 *
 * @param client - A connected client.
 * @param issuer - The issuer wallet (pays the public MPT).
 * @param mptID - The MPTokenIssuanceID.
 * @param amount - The balance to establish.
 * @returns The holder with `amount` spendable confidential balance.
 */
// eslint-disable-next-line max-params -- (client, issuer, mptID, amount) setup tuple
export async function holderWithBalance(
  client: Client,
  issuer: Wallet,
  mptID: string,
  amount: bigint,
): Promise<Holder> {
  const holder = await setupHolder(client, mptID)
  const payment: Payment = {
    TransactionType: 'Payment',
    Account: issuer.classicAddress,
    Destination: holder.wallet.classicAddress,
    Amount: { mpt_issuance_id: mptID, value: amount.toString() },
  }
  await testTransaction(client, payment, issuer)
  await testTransaction(
    client,
    await prepareConfidentialConvert(client, {
      account: holder.wallet.classicAddress,
      amount,
      holder: holder.key,
      mptIssuanceID: mptID,
    }),
    holder.wallet,
  )
  await testTransaction(
    client,
    await prepareConfidentialMergeInbox(client, {
      account: holder.wallet.classicAddress,
      mptIssuanceID: mptID,
    }),
    holder.wallet,
  )
  return holder
}

/**
 * Read a holder's spendable confidential balance with its own private key.
 *
 * @param client - A connected client.
 * @param holder - The holder.
 * @param mptID - The MPTokenIssuanceID.
 * @returns The decrypted spendable balance.
 */
export async function getSpendable(
  client: Client,
  holder: Holder,
  mptID: string,
): Promise<bigint> {
  return getConfidentialBalance(
    client,
    holder.wallet.classicAddress,
    mptID,
    holder.key.privateKey,
  )
}

/**
 * Auditor selective disclosure: decrypt a holder's balance with the auditor key.
 *
 * @param client - A connected client.
 * @param holderAddress - The holder's classic address.
 * @param mptID - The MPTokenIssuanceID.
 * @param auditorKey - The auditor ElGamal keypair.
 * @returns The decrypted balance the auditor sees.
 */
// eslint-disable-next-line max-params -- (client, holder, mptID, auditorKey) disclosure tuple
export async function auditorReads(
  client: Client,
  holderAddress: string,
  mptID: string,
  auditorKey: ConfidentialKeypair,
): Promise<bigint> {
  const token = await fetchMPToken(client, holderAddress, mptID)
  assert.isString(
    token.AuditorEncryptedBalance,
    'holder MPToken carries an AuditorEncryptedBalance',
  )
  return decryptAmount(
    token.AuditorEncryptedBalance as string,
    auditorKey.privateKey,
  )
}

/**
 * Issuer-side authorization of a holder's MPToken — required to hold a
 * RequireAuth issuance. Sets `lsfMPTAuthorized` on the holder's MPToken.
 *
 * @param client - A connected client.
 * @param issuer - The issuer wallet.
 * @param holder - The holder's classic address.
 * @param mptID - The MPTokenIssuanceID.
 */
// eslint-disable-next-line max-params -- (client, issuer, holder, mptID) tuple
export async function authorizeHolder(
  client: Client,
  issuer: Wallet,
  holder: string,
  mptID: string,
): Promise<void> {
  await testTransaction(
    client,
    {
      TransactionType: 'MPTokenAuthorize',
      Account: issuer.classicAddress,
      MPTokenIssuanceID: mptID,
      Holder: holder,
    },
    issuer,
  )
}

/**
 * Issuer locks an individual holder's MPToken (`tfMPTLock` + `Holder`), setting
 * `lsfMPTLocked` on that holder's MPToken.
 *
 * @param client - A connected client.
 * @param issuer - The issuer wallet.
 * @param holder - The holder's classic address.
 * @param mptID - The MPTokenIssuanceID.
 */
// eslint-disable-next-line max-params -- (client, issuer, holder, mptID) tuple
export async function lockHolder(
  client: Client,
  issuer: Wallet,
  holder: string,
  mptID: string,
): Promise<void> {
  await testTransaction(
    client,
    {
      TransactionType: 'MPTokenIssuanceSet',
      Account: issuer.classicAddress,
      MPTokenIssuanceID: mptID,
      Holder: holder,
      Flags: { tfMPTLock: true },
    },
    issuer,
  )
}
