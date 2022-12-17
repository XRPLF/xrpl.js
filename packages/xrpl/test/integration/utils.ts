import { assert } from 'chai'
import omit from 'lodash/omit'
import { decode } from 'ripple-binary-codec'
import {
  Client,
  Wallet,
  AccountInfoRequest,
  type SubmitResponse,
  TimeoutError,
  NotConnectedError,
} from 'xrpl-local'
import { Payment, Transaction } from 'xrpl-local/models/transactions'
import { hashSignedTx } from 'xrpl-local/utils/hashes'

const masterAccount = 'rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh'
const masterSecret = 'snoPBrXtMeMyMHUVTgbuqAfg1SUTb'

// let ledgerAcceptMutex = false

export async function ledgerAccept(
  client: Client,
  retries?: number,
): Promise<void> {
  const request = { command: 'ledger_accept' }

  try {
    await client.connection.request(request)
  } catch (error) {
    if (retries === undefined) {
      setTimeout(() => {
        ledgerAccept(client, 10)
      }, 1000)
    } else if (retries > 0) {
      setTimeout(() => {
        ledgerAccept(client, retries - 1)
      }, 1000)
    } else {
      throw error
    }
  }
}

export function subscribeDone(client: Client): void {
  client.removeAllListeners()
}

async function runCommand({
  client,
  transaction,
  wallet,
  retry = { count: 5, delayMs: 1000 },
}: {
  client: Client
  transaction: Transaction
  wallet: Wallet
  retry?: {
    count: number
    delayMs: number
  }
}): Promise<SubmitResponse> {
  let response: SubmitResponse
  try {
    response = await client.submit(transaction, { wallet })

    // Retry if another transaction finished before this one
    while (
      ['tefPAST_SEQ', 'tefMAX_LEDGER'].includes(
        response.result.engine_result,
      ) &&
      retry.count > 0
    ) {
      // eslint-disable-next-line no-param-reassign -- we want to decrement the count
      retry.count -= 1
      // eslint-disable-next-line no-await-in-loop, no-promise-executor-return -- We are waiting on retries
      await new Promise((resolve) => setTimeout(resolve, retry.delayMs))
      // eslint-disable-next-line no-await-in-loop -- We are retryhing in a loop on purpose
      response = await client.submit(transaction, { wallet })
    }
  } catch (error) {
    if (error instanceof TimeoutError || error instanceof NotConnectedError) {
      // retry
      return runCommand({
        client,
        transaction,
        wallet,
        retry: {
          ...retry,
          count: retry.count > 0 ? retry.count - 1 : 0,
        },
      })
    }

    throw error
  }

  return response
}

export async function fundAccount(
  client: Client,
  wallet: Wallet,
  retry?: {
    count: number
    delayMs: number
  },
): Promise<SubmitResponse> {
  const payment: Payment = {
    TransactionType: 'Payment',
    Account: masterAccount,
    Destination: wallet.classicAddress,
    // 2 times the amount needed for a new account (20 XRP)
    Amount: '400000000',
  }
  const wal = Wallet.fromSeed(masterSecret)
  const response = await runCommand({
    client,
    wallet: wal,
    transaction: payment,
    retry,
  })

  if (response.result.engine_result !== 'tesSUCCESS') {
    // eslint-disable-next-line no-console -- happens only when something goes wrong
    console.log(response)
    assert.fail(`Response not successful, ${response.result.engine_result}`)
  }
  await ledgerAccept(client)
  const signedTx = omit(response.result.tx_json, 'hash')
  await verifySubmittedTransaction(client, signedTx as Transaction)
  return response
}

export async function generateFundedWallet(client: Client): Promise<Wallet> {
  const wallet = Wallet.generate()
  await fundAccount(client, wallet)
  return wallet
}

export async function verifySubmittedTransaction(
  client: Client,
  tx: Transaction | string,
  hashTx?: string,
): Promise<void> {
  const hash = hashTx ?? hashSignedTx(tx)
  const data = await client.request({
    command: 'tx',
    transaction: hash,
  })

  assert(data.result)
  assert.deepEqual(
    omit(data.result, [
      'date',
      'hash',
      'inLedger',
      'ledger_index',
      'meta',
      'validated',
    ]),
    typeof tx === 'string' ? decode(tx) : tx,
  )
  if (typeof data.result.meta === 'object') {
    assert.strictEqual(data.result.meta.TransactionResult, 'tesSUCCESS')
  } else {
    assert.strictEqual(data.result.meta, 'tesSUCCESS')
  }
}

/**
 * Sends a test transaction for integration testing.
 *
 * @param client - The XRPL client
 * @param transaction - The transaction object to send.
 * @param wallet - The wallet to send the transaction from.
 * @param retry - As of Sep 2022, xrpl.js does not track requests sent in parallel. Our sequence numbers can get off from
 *               the server's sequence numbers. This is a fix to retry the transaction if it fails due to tefPAST_SEQ.
 * @param retry.count - How many times the request should be retried.
 * @param retry.delayMs - How long to wait between retries.
 * @returns The response of the transaction.
 */
// eslint-disable-next-line max-params -- Test function, many params are needed
export async function testTransaction(
  client: Client,
  transaction: Transaction,
  wallet: Wallet,
  retry?: {
    count: number
    delayMs: number
  },
): Promise<SubmitResponse> {
  // Accept any un-validated changes.
  await ledgerAccept(client)

  // sign/submit the transaction
  const response = await runCommand({ client, wallet, transaction, retry })

  // check that the transaction was successful
  assert.equal(response.type, 'response')

  if (response.result.engine_result !== 'tesSUCCESS') {
    // eslint-disable-next-line no-console -- See output
    console.error(transaction)
    // eslint-disable-next-line no-console -- See output
    console.error(response)
  }

  assert.equal(
    response.result.engine_result,
    'tesSUCCESS',
    response.result.engine_result_message,
  )

  // check that the transaction is on the ledger
  const signedTx = omit(response.result.tx_json, 'hash')
  await ledgerAccept(client)
  await verifySubmittedTransaction(client, signedTx as Transaction)
  return response
}

export async function getXRPBalance(
  client: Client,
  wallet: Wallet,
): Promise<string> {
  const request: AccountInfoRequest = {
    command: 'account_info',
    account: wallet.classicAddress,
  }
  return (await client.request(request)).result.account_data.Balance
}
