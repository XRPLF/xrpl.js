/* eslint-disable n/no-process-env -- sandbox configuration comes from env vars */
import { generateKeypair, decryptAmount } from '@xrplf/mpt-crypto'
import { assert } from 'chai'

import { Client, Wallet } from '../../../src'
import {
  fetchMPToken,
  getConfidentialBalance,
  prepareConfidentialClawback,
  prepareConfidentialConvert,
  prepareConfidentialConvertBack,
  prepareConfidentialMergeInbox,
  prepareConfidentialSend,
} from '../../../src/confidential'

/*
 * Live Confidential MPT (XLS-0096) integration tests against the hosted Repo
 * Sandbox (a rippled built from PR #5860 with the ConfidentialTransfer amendment
 * enabled). OFF by default — the standard `npm run test:integration` targets a
 * local standalone rippled without the amendment. Enable with:
 *
 *   CONFIDENTIAL_SANDBOX=true npx jest --config=jest.config.integration.js \
 *     test/integration/confidential/confidentialMPT.test.ts
 *
 * Coverage:
 *  - Each of the five new tx types, exercised independently with its own setup.
 *  - A full 4-party lifecycle that also registers an auditor key and verifies
 *    auditor selective disclosure (the auditor decrypts holder balances).
 *
 * Sandbox specifics:
 *  - `server_info` omits `network_id`, so `client.connect()` throws on current
 *    `main`; we catch it and pin `networkID = 0` (network 0 needs no NetworkID).
 *  - Accounts are funded via the faucet, not genesis.
 *  - No admin `ledger_accept`; we give each tx a generous LastLedgerSequence
 *    window measured from the CURRENT (open) ledger.
 */

const RUN_SANDBOX = process.env.CONFIDENTIAL_SANDBOX === 'true'
const SANDBOX_URL =
  process.env.CONFIDENTIAL_SANDBOX_URL ?? 'wss://repo-sandbox.ripplex.io:6006'
const FAUCET_URL =
  process.env.CONFIDENTIAL_SANDBOX_FAUCET ??
  'https://faucet.repo-sandbox.ripplex.io/accounts'

const TX_TIMEOUT = 300_000
const LIFECYCLE_TIMEOUT = 600_000
const SETUP_TIMEOUT = 180_000
const LEDGER_WINDOW = 200
const FUND_POLL_ATTEMPTS = 15
const FUND_POLL_DELAY = 2000

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- transactions span many tx types
type AnyTx = Record<string, any>
interface Keypair {
  privateKey: string
  publicKey: string
}
interface Holder {
  wallet: Wallet
  key: Keypair
}

const sleep = async (ms: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, ms)
  })

/**
 * Connect to the sandbox, tolerating its missing `network_id`.
 *
 * @param url - The sandbox WebSocket URL.
 * @returns A connected client with `networkID` pinned to 0.
 */
async function connectSandbox(url: string): Promise<Client> {
  const client = new Client(url, { connectionTimeout: 20_000 })
  try {
    await client.connect()
  } catch {
    // The sandbox omits network_id from server_info; the socket is still open.
  }
  client.networkID = 0
  assert.isTrue(client.isConnected(), 'sandbox connection should be open')
  return client
}

/**
 * Fund a fresh account from the sandbox faucet and wait for it to materialize.
 *
 * @param client - A connected sandbox client.
 * @returns The funded wallet.
 */
async function fundFromFaucet(client: Client): Promise<Wallet> {
  const res = await fetch(FAUCET_URL, { method: 'POST' })
  const body = (await res.json()) as { seed: string }
  const wallet = Wallet.fromSeed(body.seed)
  for (let attempt = 0; attempt < FUND_POLL_ATTEMPTS; attempt++) {
    try {
      // eslint-disable-next-line no-await-in-loop -- sequential polling is intended
      await client.request({
        command: 'account_info',
        account: wallet.classicAddress,
      })
      return wallet
    } catch {
      // eslint-disable-next-line no-await-in-loop -- sequential polling is intended
      await sleep(FUND_POLL_DELAY)
    }
  }
  throw new Error(`faucet funding for ${wallet.classicAddress} never validated`)
}

/**
 * Submit a transaction with a generous validation window and assert success.
 *
 * @param client - A connected sandbox client.
 * @param tx - The (field-complete) transaction.
 * @param wallet - The signing wallet.
 * @returns The validated transaction result.
 */
async function submitOk(
  client: Client,
  tx: AnyTx,
  wallet: Wallet,
): Promise<AnyTx> {
  // Window from the CURRENT (open) ledger, not the validated index, which can
  // lag far behind on the shared sandbox and make the window expire instantly.
  const ledger = await client.request({ command: 'ledger_current' })
  const prepared: AnyTx =
    tx.LastLedgerSequence == null
      ? {
          ...tx,
          LastLedgerSequence:
            ledger.result.ledger_current_index + LEDGER_WINDOW,
        }
      : tx
  const response = await client.submitAndWait(
    prepared as Parameters<typeof client.submitAndWait>[0],
    { wallet },
  )
  const meta = response.result.meta as
    | { TransactionResult?: string }
    | undefined
  // Progress trace for the long-running sandbox suite (so a timeout pinpoints
  // the last completed step).
  // eslint-disable-next-line no-console -- intentional IT progress output
  console.log(
    `    [submit] ${String(tx.TransactionType)} -> ${
      meta?.TransactionResult ?? 'unknown'
    }`,
  )
  assert.strictEqual(
    meta?.TransactionResult,
    'tesSUCCESS',
    `${String(tx.TransactionType)} should succeed`,
  )
  return response.result
}

/**
 * Create a confidential-capable MPT issuance and register the issuer (and,
 * optionally, auditor) encryption key.
 *
 * @param client - A connected sandbox client.
 * @param issuer - The issuer wallet.
 * @param issuerKey - The issuer's ElGamal keypair.
 * @param auditorKey - Optional auditor ElGamal keypair to register.
 * @returns The new MPTokenIssuanceID.
 */
// eslint-disable-next-line max-params -- (client, issuer, issuerKey, auditorKey) setup tuple
async function createConfidentialIssuance(
  client: Client,
  issuer: Wallet,
  issuerKey: Keypair,
  auditorKey?: Keypair,
): Promise<string> {
  const created = await submitOk(
    client,
    {
      TransactionType: 'MPTokenIssuanceCreate',
      Account: issuer.classicAddress,
      MaximumAmount: '9223372036854775807',
      AssetScale: 0,
      Flags: {
        tfMPTCanTransfer: true,
        tfMPTCanClawback: true,
        tfMPTCanConfidentialAmount: true,
      },
    },
    issuer,
  )
  const issuanceID = (created.meta as { mpt_issuance_id: string })
    .mpt_issuance_id
  // rippled requires the auditor key to be registered together with the issuer
  // key in a single MPTokenIssuanceSet (an auditor-only update is temMALFORMED),
  // and the keys are immutable once set — so register both at once.
  const registerKeys: AnyTx = {
    TransactionType: 'MPTokenIssuanceSet',
    Account: issuer.classicAddress,
    MPTokenIssuanceID: issuanceID,
    IssuerEncryptionKey: issuerKey.publicKey,
  }
  if (auditorKey != null) {
    registerKeys.AuditorEncryptionKey = auditorKey.publicKey
  }
  await submitOk(client, registerKeys, issuer)
  return issuanceID
}

/**
 * Fund a fresh holder and opt it in to the issuance.
 *
 * @param client - A connected sandbox client.
 * @param issuanceID - The MPTokenIssuanceID.
 * @returns The holder wallet and a fresh ElGamal keypair.
 */
async function setupHolder(
  client: Client,
  issuanceID: string,
): Promise<Holder> {
  const wallet = await fundFromFaucet(client)
  const key = await generateKeypair()
  await submitOk(
    client,
    {
      TransactionType: 'MPTokenAuthorize',
      Account: wallet.classicAddress,
      MPTokenIssuanceID: issuanceID,
    },
    wallet,
  )
  return { wallet, key }
}

/**
 * Register a holder's encryption key (zero-amount convert), with no balance.
 *
 * @param client - A connected sandbox client.
 * @param issuanceID - The MPTokenIssuanceID.
 * @returns The registered holder.
 */
async function registerHolderKey(
  client: Client,
  issuanceID: string,
): Promise<Holder> {
  const holder = await setupHolder(client, issuanceID)
  const tx = await prepareConfidentialConvert(client, {
    account: holder.wallet.classicAddress,
    amount: 0n,
    holder: holder.key,
    mptIssuanceID: issuanceID,
  })
  await submitOk(client, tx, holder.wallet)
  return holder
}

/**
 * Give a fresh holder a spendable confidential balance (pay public MPT, then
 * convert and merge).
 *
 * @param client - A connected sandbox client.
 * @param issuer - The issuer wallet (pays the public MPT).
 * @param issuanceID - The MPTokenIssuanceID.
 * @param amount - The balance to establish.
 * @returns The holder with `amount` spendable confidential balance.
 */
// eslint-disable-next-line max-params -- (client, issuer, issuance, amount) setup tuple
async function holderWithBalance(
  client: Client,
  issuer: Wallet,
  issuanceID: string,
  amount: bigint,
): Promise<Holder> {
  const holder = await setupHolder(client, issuanceID)
  await submitOk(
    client,
    {
      TransactionType: 'Payment',
      Account: issuer.classicAddress,
      Destination: holder.wallet.classicAddress,
      Amount: { mpt_issuance_id: issuanceID, value: amount.toString() },
    },
    issuer,
  )
  const convert = await prepareConfidentialConvert(client, {
    account: holder.wallet.classicAddress,
    amount,
    holder: holder.key,
    mptIssuanceID: issuanceID,
  })
  await submitOk(client, convert, holder.wallet)
  const merge = await prepareConfidentialMergeInbox(client, {
    account: holder.wallet.classicAddress,
    mptIssuanceID: issuanceID,
  })
  await submitOk(client, merge, holder.wallet)
  return holder
}

/**
 * Decrypt a hex ciphertext field, asserting it is present first.
 *
 * @param hex - The hex ciphertext (or undefined).
 * @param privateKey - The decrypting private key.
 * @param label - A label for the presence assertion.
 * @returns The decrypted amount.
 */
async function decryptField(
  hex: string | undefined,
  privateKey: string,
  label: string,
): Promise<bigint> {
  assert.isString(hex, `${label} should be present`)
  return decryptAmount(hex as string, privateKey)
}

;(RUN_SANDBOX ? describe : describe.skip)(
  'Confidential MPT (Repo Sandbox)',
  function () {
    let client: Client

    beforeAll(async () => {
      client = await connectSandbox(SANDBOX_URL)
    }, SETUP_TIMEOUT)

    afterAll(async () => {
      await client.disconnect()
    })

    describe('individual transaction types', function () {
      let issuer: Wallet
      let issuerKey: Keypair
      let issuanceID: string

      // One confidential-capable issuance (issuer key only) shared as read-only
      // infra; each test below funds its own fresh holders, so they stay
      // independent at the transaction level.
      beforeAll(async () => {
        issuer = await fundFromFaucet(client)
        issuerKey = await generateKeypair()
        issuanceID = await createConfidentialIssuance(client, issuer, issuerKey)
      }, SETUP_TIMEOUT)

      it(
        'ConfidentialMPTConvert: registers the holder key and moves a public balance into the confidential inbox',
        async () => {
          const holder = await setupHolder(client, issuanceID)
          await submitOk(
            client,
            {
              TransactionType: 'Payment',
              Account: issuer.classicAddress,
              Destination: holder.wallet.classicAddress,
              Amount: { mpt_issuance_id: issuanceID, value: '1000' },
            },
            issuer,
          )
          const tx = await prepareConfidentialConvert(client, {
            account: holder.wallet.classicAddress,
            amount: 1000n,
            holder: holder.key,
            mptIssuanceID: issuanceID,
          })
          await submitOk(client, tx, holder.wallet)

          const token = await fetchMPToken(
            client,
            holder.wallet.classicAddress,
            issuanceID,
          )
          assert.strictEqual(
            token.HolderEncryptionKey,
            holder.key.publicKey,
            'holder encryption key is registered',
          )
          assert.strictEqual(
            await decryptField(
              token.ConfidentialBalanceInbox,
              holder.key.privateKey,
              'ConfidentialBalanceInbox',
            ),
            1000n,
            'inbox holds the converted amount',
          )
        },
        TX_TIMEOUT,
      )

      it(
        'ConfidentialMPTMergeInbox: folds the inbox into the spendable balance',
        async () => {
          const holder = await setupHolder(client, issuanceID)
          await submitOk(
            client,
            {
              TransactionType: 'Payment',
              Account: issuer.classicAddress,
              Destination: holder.wallet.classicAddress,
              Amount: { mpt_issuance_id: issuanceID, value: '500' },
            },
            issuer,
          )
          await submitOk(
            client,
            await prepareConfidentialConvert(client, {
              account: holder.wallet.classicAddress,
              amount: 500n,
              holder: holder.key,
              mptIssuanceID: issuanceID,
            }),
            holder.wallet,
          )

          await submitOk(
            client,
            await prepareConfidentialMergeInbox(client, {
              account: holder.wallet.classicAddress,
              mptIssuanceID: issuanceID,
            }),
            holder.wallet,
          )

          assert.strictEqual(
            await getConfidentialBalance(
              client,
              holder.wallet.classicAddress,
              issuanceID,
              holder.key.privateKey,
            ),
            500n,
            'spendable balance equals the merged amount',
          )
        },
        TX_TIMEOUT,
      )

      it(
        'ConfidentialMPTConvertBack: reveals a public amount from the confidential balance',
        async () => {
          const holder = await holderWithBalance(
            client,
            issuer,
            issuanceID,
            1000n,
          )

          await submitOk(
            client,
            await prepareConfidentialConvertBack(client, {
              account: holder.wallet.classicAddress,
              amount: 400n,
              holder: holder.key,
              mptIssuanceID: issuanceID,
            }),
            holder.wallet,
          )

          assert.strictEqual(
            await getConfidentialBalance(
              client,
              holder.wallet.classicAddress,
              issuanceID,
              holder.key.privateKey,
            ),
            600n,
            'spendable balance reduced by the revealed amount',
          )
        },
        TX_TIMEOUT,
      )

      it(
        'ConfidentialMPTSend: transfers a confidential amount to another holder',
        async () => {
          const sender = await holderWithBalance(
            client,
            issuer,
            issuanceID,
            1000n,
          )
          const dest = await registerHolderKey(client, issuanceID)

          await submitOk(
            client,
            await prepareConfidentialSend(client, {
              account: sender.wallet.classicAddress,
              destination: dest.wallet.classicAddress,
              amount: 300n,
              sender: sender.key,
              mptIssuanceID: issuanceID,
            }),
            sender.wallet,
          )

          assert.strictEqual(
            await getConfidentialBalance(
              client,
              sender.wallet.classicAddress,
              issuanceID,
              sender.key.privateKey,
            ),
            700n,
            'sender balance reduced by the sent amount',
          )
          const destToken = await fetchMPToken(
            client,
            dest.wallet.classicAddress,
            issuanceID,
          )
          assert.strictEqual(
            await decryptField(
              destToken.ConfidentialBalanceInbox,
              dest.key.privateKey,
              'destination ConfidentialBalanceInbox',
            ),
            300n,
            'destination inbox received the sent amount',
          )
        },
        TX_TIMEOUT,
      )

      it(
        'ConfidentialMPTClawback: issuer claws back a holder confidential balance',
        async () => {
          const holder = await holderWithBalance(
            client,
            issuer,
            issuanceID,
            1000n,
          )

          await submitOk(
            client,
            await prepareConfidentialClawback(client, {
              account: issuer.classicAddress,
              holder: holder.wallet.classicAddress,
              issuer: issuerKey,
              mptIssuanceID: issuanceID,
            }),
            issuer,
          )

          assert.strictEqual(
            await getConfidentialBalance(
              client,
              holder.wallet.classicAddress,
              issuanceID,
              holder.key.privateKey,
            ),
            0n,
            'holder confidential balance is zeroed',
          )
        },
        TX_TIMEOUT,
      )
    })

    it(
      'runs the full 4-party lifecycle with auditor selective disclosure',
      async () => {
        const issuer = await fundFromFaucet(client)
        const issuerKey = await generateKeypair()
        const auditorKey = await generateKeypair()
        const issuanceID = await createConfidentialIssuance(
          client,
          issuer,
          issuerKey,
          auditorKey,
        )

        // Holder1 converts 1000 public -> confidential and merges.
        const holder1 = await holderWithBalance(
          client,
          issuer,
          issuanceID,
          1000n,
        )
        assert.strictEqual(
          await getConfidentialBalance(
            client,
            holder1.wallet.classicAddress,
            issuanceID,
            holder1.key.privateKey,
          ),
          1000n,
        )
        // Auditor selective disclosure: the auditor reads holder1's balance
        // using only the auditor key (no holder/spending key).
        let h1 = await fetchMPToken(
          client,
          holder1.wallet.classicAddress,
          issuanceID,
        )
        assert.strictEqual(
          await decryptField(
            h1.AuditorEncryptedBalance,
            auditorKey.privateKey,
            'holder1 AuditorEncryptedBalance',
          ),
          1000n,
          'auditor decrypts holder1 balance after convert',
        )

        // Holder2 registers its key, then holder1 sends 300.
        const holder2 = await registerHolderKey(client, issuanceID)
        await submitOk(
          client,
          await prepareConfidentialSend(client, {
            account: holder1.wallet.classicAddress,
            destination: holder2.wallet.classicAddress,
            amount: 300n,
            sender: holder1.key,
            mptIssuanceID: issuanceID,
          }),
          holder1.wallet,
        )
        await submitOk(
          client,
          await prepareConfidentialMergeInbox(client, {
            account: holder2.wallet.classicAddress,
            mptIssuanceID: issuanceID,
          }),
          holder2.wallet,
        )
        assert.strictEqual(
          await getConfidentialBalance(
            client,
            holder1.wallet.classicAddress,
            issuanceID,
            holder1.key.privateKey,
          ),
          700n,
        )
        assert.strictEqual(
          await getConfidentialBalance(
            client,
            holder2.wallet.classicAddress,
            issuanceID,
            holder2.key.privateKey,
          ),
          300n,
        )
        // Auditor reads both sides after the transfer.
        h1 = await fetchMPToken(
          client,
          holder1.wallet.classicAddress,
          issuanceID,
        )
        assert.strictEqual(
          await decryptField(
            h1.AuditorEncryptedBalance,
            auditorKey.privateKey,
            'holder1 AuditorEncryptedBalance',
          ),
          700n,
          'auditor decrypts holder1 balance after send',
        )
        const h2 = await fetchMPToken(
          client,
          holder2.wallet.classicAddress,
          issuanceID,
        )
        assert.strictEqual(
          await decryptField(
            h2.AuditorEncryptedBalance,
            auditorKey.privateKey,
            'holder2 AuditorEncryptedBalance',
          ),
          300n,
          'auditor decrypts holder2 balance after receive',
        )

        // Holder1 converts back 200, then the issuer claws back the rest.
        await submitOk(
          client,
          await prepareConfidentialConvertBack(client, {
            account: holder1.wallet.classicAddress,
            amount: 200n,
            holder: holder1.key,
            mptIssuanceID: issuanceID,
          }),
          holder1.wallet,
        )
        assert.strictEqual(
          await getConfidentialBalance(
            client,
            holder1.wallet.classicAddress,
            issuanceID,
            holder1.key.privateKey,
          ),
          500n,
        )
        await submitOk(
          client,
          await prepareConfidentialClawback(client, {
            account: issuer.classicAddress,
            holder: holder1.wallet.classicAddress,
            issuer: issuerKey,
            mptIssuanceID: issuanceID,
          }),
          issuer,
        )
        assert.strictEqual(
          await getConfidentialBalance(
            client,
            holder1.wallet.classicAddress,
            issuanceID,
            holder1.key.privateKey,
          ),
          0n,
        )
      },
      LIFECYCLE_TIMEOUT,
    )
  },
)
