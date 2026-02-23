import {
  Client,
  MPTokenIssuanceCreate,
  MPTokenIssuanceCreateFlags,
  MPTokenAuthorize,
  Payment,
  AMMCreate,
  TransactionMetadata,
  Wallet,
} from '../../src'
import type { MPTAmount, MPTCurrency } from '../../src/models/common'

import { generateFundedWallet, testTransaction } from './utils'

/**
 * Creates an MPT issuance and returns the mpt_issuance_id.
 *
 * @param client - The XRPL client.
 * @param issuerWallet - The wallet that will issue the MPT.
 * @param flags - Optional flags for the issuance.
 * @returns The mpt_issuance_id of the newly created issuance.
 */
export async function createMPTIssuance(
  client: Client,
  issuerWallet: Wallet,
  flags?: number,
): Promise<string> {
  const createTx: MPTokenIssuanceCreate = {
    TransactionType: 'MPTokenIssuanceCreate',
    Account: issuerWallet.classicAddress,
    Flags: flags ?? 0,
  }

  const mptCreateRes = await testTransaction(client, createTx, issuerWallet)

  const txHash = mptCreateRes.result.tx_json.hash

  const txResponse = await client.request({
    command: 'tx',
    transaction: txHash,
  })

  const meta = txResponse.result
    .meta as TransactionMetadata<MPTokenIssuanceCreate>

  const mptID = meta.mpt_issuance_id
  if (!mptID) {
    throw new Error('Failed to get mpt_issuance_id from transaction metadata')
  }

  return mptID
}

/**
 * Creates an MPT issuance, authorizes a holder, and funds them with MPT tokens.
 *
 * @param client - The XRPL client.
 * @param issuerWallet - The wallet that will issue the MPT.
 * @param holderWallet - The wallet that will hold the MPT.
 * @param flags - Optional flags for the issuance (defaults to tfMPTCanTrade | tfMPTCanTransfer).
 * @param fundAmount - Amount of MPT to send to the holder (defaults to '100000').
 * @returns The mpt_issuance_id of the newly created issuance.
 */
// eslint-disable-next-line max-params -- all params are distinct and necessary
export async function createMPTIssuanceAndAuthorize(
  client: Client,
  issuerWallet: Wallet,
  holderWallet: Wallet,
  // eslint-disable-next-line no-bitwise -- combining flags requires bitwise OR
  flags: number = MPTokenIssuanceCreateFlags.tfMPTCanTrade |
    MPTokenIssuanceCreateFlags.tfMPTCanTransfer,
  fundAmount = '100000',
): Promise<string> {
  const mptIssuanceId = await createMPTIssuance(client, issuerWallet, flags)

  // Authorize the holder
  const authTx: MPTokenAuthorize = {
    TransactionType: 'MPTokenAuthorize',
    Account: holderWallet.classicAddress,
    MPTokenIssuanceID: mptIssuanceId,
  }
  await testTransaction(client, authTx, holderWallet)

  // Fund the holder with MPT
  const payTx: Payment = {
    TransactionType: 'Payment',
    Account: issuerWallet.classicAddress,
    Destination: holderWallet.classicAddress,
    Amount: {
      mpt_issuance_id: mptIssuanceId,
      value: fundAmount,
    },
  }
  await testTransaction(client, payTx, issuerWallet)

  return mptIssuanceId
}

export interface TestMPTAMMPool {
  asset: MPTCurrency
  asset2: MPTCurrency
  issuerWallet1: Wallet
  issuerWallet2: Wallet
  lpWallet: Wallet
}

/**
 * Creates a full MPT/MPT AMM pool with two issuers and one LP.
 * Each MPT is created with tfMPTCanTransfer | tfMPTCanTrade | tfMPTCanClawback.
 *
 * @param client - The XRPL client.
 * @returns An object containing both MPT assets, issuer wallets, and the LP wallet.
 */
export async function createAMMPoolWithMPT(
  client: Client,
): Promise<TestMPTAMMPool> {
  const issuerWallet1 = await generateFundedWallet(client)
  const issuerWallet2 = await generateFundedWallet(client)
  const lpWallet = await generateFundedWallet(client)

  /* eslint-disable no-bitwise -- combining flags requires bitwise OR */
  const mptFlags =
    MPTokenIssuanceCreateFlags.tfMPTCanTransfer |
    MPTokenIssuanceCreateFlags.tfMPTCanTrade |
    MPTokenIssuanceCreateFlags.tfMPTCanClawback
  /* eslint-enable no-bitwise */

  const mptIssuanceId1 = await createMPTIssuanceAndAuthorize(
    client,
    issuerWallet1,
    lpWallet,
    mptFlags,
  )

  const mptIssuanceId2 = await createMPTIssuanceAndAuthorize(
    client,
    issuerWallet2,
    lpWallet,
    mptFlags,
  )

  const ammCreateTx: AMMCreate = {
    TransactionType: 'AMMCreate',
    Account: lpWallet.classicAddress,
    Amount: {
      mpt_issuance_id: mptIssuanceId1,
      value: '250',
    } as unknown as MPTAmount,
    Amount2: {
      mpt_issuance_id: mptIssuanceId2,
      value: '250',
    } as unknown as MPTAmount,
    TradingFee: 12,
  }

  await testTransaction(client, ammCreateTx, lpWallet)

  const asset: MPTCurrency = { mpt_issuance_id: mptIssuanceId1 }
  const asset2: MPTCurrency = { mpt_issuance_id: mptIssuanceId2 }

  return {
    asset,
    asset2,
    issuerWallet1,
    issuerWallet2,
    lpWallet,
  }
}
