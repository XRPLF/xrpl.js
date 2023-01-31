import { assert } from 'chai'
import omit from 'lodash/omit'
import throttle from 'lodash/throttle'
import { decode } from 'ripple-binary-codec'
import {
  Client,
  Wallet,
  AccountInfoRequest,
  type SubmitResponse,
  TimeoutError,
  NotConnectedError,
  unixTimeToRippleTime,
} from 'xrpl-local'
import { Payment, Transaction } from 'xrpl-local/models/transactions'
import { hashSignedTx } from 'xrpl-local/utils/hashes'

const masterAccount = 'rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh'
const masterSecret = 'snoPBrXtMeMyMHUVTgbuqAfg1SUTb'

async function sendLedgerAccept(client: Client): Promise<unknown> {
  return client.connection.request({ command: 'ledger_accept' })
}

/**
 * Throttles an async function in a way that can be awaited.
 * By default throttle doesn't return a promise for async functions unless it's invoking them immediately.
 *
 * @param func - async function to throttle calls for.
 * @param wait - same function as lodash.throttle's wait parameter. Call this function at most this often.
 * @returns a promise which will be resolved/ rejected only if the function is executed, with the result of the underlying call.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Proper
function asyncThrottle<F extends (...args: any[]) => Promise<unknown>>(
  func: F,
  wait?: number,
): (...args: Parameters<F>) => ReturnType<F> {
  const throttled = throttle((resolve, reject, args: Parameters<F>) => {
    func(...args)
      .then(resolve)
      .catch(reject)
  }, wait)
  const ret = (...args: Parameters<F>): ReturnType<F> =>
    new Promise((resolve, reject) => {
      throttled(resolve, reject, args)
    }) as ReturnType<F>
  return ret
}

const throttledLedgerAccept = asyncThrottle(sendLedgerAccept, 1000)

export async function ledgerAccept(
  client: Client,
  retries?: number,
  shouldThrottle?: boolean,
): Promise<unknown> {
  return new Promise<unknown>((resolve, reject) => {
    const ledgerAcceptFunc = shouldThrottle
      ? throttledLedgerAccept
      : sendLedgerAccept
    ledgerAcceptFunc(client)
      .then(resolve)
      .catch((error) => {
        if (retries === undefined) {
          setTimeout(() => {
            resolve(ledgerAccept(client, 10))
          }, 1000)
        } else if (retries > 0) {
          setTimeout(() => {
            resolve(ledgerAccept(client, retries - 1))
          }, 1000)
        } else {
          reject(error)
        }
      })
  })
}

/**
 * Attempt to get the time after which we can check for the escrow to be finished.
 * Sometimes the ledger close_time is in the future, so we need to wait for it to catch up.
 *
 * @param targetTime - The target wait time, before accounting for current ledger time.
 * @param minimumWaitTimeInMs - The minimum wait time in milliseconds.
 * @param maximumWaitTimeInMs - The maximum wait time in milliseconds.
 * @returns The wait time in milliseconds.
 */
export function calculateWaitTimeForTransaction(
  targetTime: number,
  minimumWaitTimeInMs = 5000,
  maximumWaitTimeInMs = 20000,
): number {
  const currentTimeUnixInMs = Math.floor(new Date().getTime())
  const currentTimeRippleInSeconds = unixTimeToRippleTime(currentTimeUnixInMs)
  const closeTimeCurrentTimeDiffInSeconds =
    currentTimeRippleInSeconds - targetTime
  const closeTimeCurrentTimeDiffInMs = closeTimeCurrentTimeDiffInSeconds * 1000
  return Math.max(
    minimumWaitTimeInMs,
    Math.min(
      Math.abs(closeTimeCurrentTimeDiffInMs) + minimumWaitTimeInMs,
      // Maximum wait time of 20 seconds
      maximumWaitTimeInMs,
    ),
  )
}

export function subscribeDone(client: Client): void {
  client.removeAllListeners()
}

export async function runCommand({
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
      // eslint-disable-next-line no-await-in-loop -- We are retrying in a loop on purpose
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
    console.error(
      `Transaction was not successful. Expected response.result.engine_result to be tesSUCCESS but got ${response.result.engine_result}`,
    )
    // eslint-disable-next-line no-console -- See output
    console.error('The transaction was: ', transaction)
    // eslint-disable-next-line no-console -- See output
    console.error('The response was: ', JSON.stringify(response))
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
