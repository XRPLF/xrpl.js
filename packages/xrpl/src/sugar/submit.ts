import { decode, encode } from 'ripple-binary-codec'

import type { Client, SubmitRequest, SubmitResponse, Wallet } from '..'
import { ValidationError, XrplError } from '../errors'
import { Signer } from '../models/common'
import { TxRequest, TxResponse } from '../models/methods'
import { Transaction } from '../models/transactions'
import { BaseTransaction } from '../models/transactions/common'
import { hashes } from '../utils'

/** Approximate time for a ledger to close, in milliseconds */
const LEDGER_CLOSE_TIME = 1000

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

/**
 * Submits a signed/unsigned transaction.
 * Steps performed on a transaction:
 *    1. Autofill.
 *    2. Sign & Encode.
 *    3. Submit.
 *
 * @param this - A Client.
 * @param transaction - A transaction to autofill, sign & encode, and submit.
 * @param opts - (Optional) Options used to sign and submit a transaction.
 * @param opts.autofill - If true, autofill a transaction.
 * @param opts.failHard - If true, and the transaction fails locally, do not retry or relay the transaction to other servers.
 * @param opts.wallet - A wallet to sign a transaction. It must be provided when submitting an unsigned transaction.
 * @returns A promise that contains SubmitResponse.
 * @throws RippledError if submit request fails.
 */
async function submit(
  this: Client,
  transaction: Transaction | string,
  opts?: {
    // If true, autofill a transaction.
    autofill?: boolean
    // If true, and the transaction fails locally, do not retry or relay the transaction to other servers.
    failHard?: boolean
    // A wallet to sign a transaction. It must be provided when submitting an unsigned transaction.
    wallet?: Wallet
  },
): Promise<SubmitResponse> {
  const signedTx = await getSignedTx(this, transaction, opts)
  return submitRequest(this, signedTx, opts?.failHard)
}

/**
 * Asynchronously submits a transaction and verifies that it has been included in a
 * validated ledger (or has errored/will not be included for some reason).
 * See [Reliable Transaction Submission](https://xrpl.org/reliable-transaction-submission.html).
 *
 * @example
 *
 * ```ts
 * const { Client, Wallet } = require('xrpl')
 * const client = new Client('wss://s.altnet.rippletest.net:51233')
 *
 * async function submitTransaction() {
 *   const senderWallet = client.fundWallet()
 *   const recipientWallet = client.fundWallet()
 *
 *   const transaction = {
 *     TransactionType: 'Payment',
 *     Account: senderWallet.address,
 *     Destination: recipientWallet.address,
 *     Amount: '10'
 *   }
 *
 *   try {
 *     await client.submit(signedTransaction, { wallet: senderWallet })
 *     console.log(result)
 *   } catch (error) {
 *     console.error(`Failed to submit transaction: ${error}`)
 *   }
 * }
 *
 * submitTransaction()
 * ```
 *
 * In this example we submit a payment transaction between two newly created testnet accounts.
 *
 * Under the hood, `submit` will call `client.autofill` by default, and because we've passed in a `Wallet` it
 * Will also sign the transaction for us before submitting the signed transaction binary blob to the ledger.
 *
 * This is similar to `submitAndWait` which does all of the above, but also waits to see if the transaction has been validated.
 * @param this - A Client.
 * @param transaction - A transaction to autofill, sign & encode, and submit.
 * @param opts - (Optional) Options used to sign and submit a transaction.
 * @param opts.autofill - If true, autofill a transaction.
 * @param opts.failHard - If true, and the transaction fails locally, do not retry or relay the transaction to other servers.
 * @param opts.wallet - A wallet to sign a transaction. It must be provided when submitting an unsigned transaction.
 * @throws Connection errors: If the `Client` object is unable to establish a connection to the specified WebSocket endpoint,
 * an error will be thrown.
 * @throws Transaction errors: If the submitted transaction is invalid or cannot be included in a validated ledger for any
 * reason, the promise returned by `submitAndWait()` will be rejected with an error. This could include issues with insufficient
 * balance, invalid transaction fields, or other issues specific to the transaction being submitted.
 * @throws Ledger errors: If the ledger being used to submit the transaction is undergoing maintenance or otherwise unavailable,
 * an error will be thrown.
 * @throws Timeout errors: If the transaction takes longer than the specified timeout period to be included in a validated
 * ledger, the promise returned by `submitAndWait()` will be rejected with an error.
 * @returns A promise that contains TxResponse, that will return when the transaction has been validated.
 */
async function submitAndWait<T extends Transaction = Transaction>(
  this: Client,
  transaction: T | string,
  opts?: {
    // If true, autofill a transaction.
    autofill?: boolean
    // If true, and the transaction fails locally, do not retry or relay the transaction to other servers.
    failHard?: boolean
    // A wallet to sign a transaction. It must be provided when submitting an unsigned transaction.
    wallet?: Wallet
  },
): Promise<TxResponse<T>> {
  const signedTx = await getSignedTx(this, transaction, opts)

  const lastLedger = getLastLedgerSequence(signedTx)
  if (lastLedger == null) {
    throw new ValidationError(
      'Transaction must contain a LastLedgerSequence value for reliable submission.',
    )
  }

  const response = await submitRequest(this, signedTx, opts?.failHard)

  const txHash = hashes.hashSignedTx(signedTx)
  return waitForFinalTransactionOutcome(
    this,
    txHash,
    lastLedger,
    response.result.engine_result,
  )
}

// Helper functions

// Encodes and submits a signed transaction.
async function submitRequest(
  client: Client,
  signedTransaction: Transaction | string,
  failHard = false,
): Promise<SubmitResponse> {
  if (!isSigned(signedTransaction)) {
    throw new ValidationError('Transaction must be signed')
  }

  const signedTxEncoded =
    typeof signedTransaction === 'string'
      ? signedTransaction
      : encode(signedTransaction)
  const request: SubmitRequest = {
    command: 'submit',
    tx_blob: signedTxEncoded,
    fail_hard: isAccountDelete(signedTransaction) || failHard,
  }
  return client.request(request)
}

/*
 * The core logic of reliable submission.  This polls the ledger until the result of the
 * transaction can be considered final, meaning it has either been included in a
 * validated ledger, or the transaction's lastLedgerSequence has been surpassed by the
 * latest ledger sequence (meaning it will never be included in a validated ledger).
 */
// eslint-disable-next-line max-params, max-lines-per-function -- this function needs to display and do with more information.
async function waitForFinalTransactionOutcome<
  T extends BaseTransaction = Transaction,
>(
  client: Client,
  txHash: string,
  lastLedger: number,
  submissionResult: string,
): Promise<TxResponse<T>> {
  await sleep(LEDGER_CLOSE_TIME)

  const latestLedger = await client.getLedgerIndex()

  if (lastLedger < latestLedger) {
    throw new XrplError(
      `The latest ledger sequence ${latestLedger} is greater than the transaction's LastLedgerSequence (${lastLedger}).\n` +
        `Preliminary result: ${submissionResult}`,
    )
  }

  const txResponse = await client
    .request<TxRequest, TxResponse<T>>({
      command: 'tx',
      transaction: txHash,
    })
    .catch(async (error) => {
      // error is of an unknown type and hence we assert type to extract the value we need.
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions,@typescript-eslint/no-unsafe-member-access -- ^
      const message = error?.data?.error as string
      if (message === 'txnNotFound') {
        return waitForFinalTransactionOutcome<T>(
          client,
          txHash,
          lastLedger,
          submissionResult,
        )
      }
      throw new Error(
        `${message} \n Preliminary result: ${submissionResult}.\nFull error details: ${String(
          error,
        )}`,
      )
    })

  if (txResponse.result.validated) {
    return txResponse
  }

  return waitForFinalTransactionOutcome<T>(
    client,
    txHash,
    lastLedger,
    submissionResult,
  )
}

// checks if the transaction has been signed
function isSigned(transaction: Transaction | string): boolean {
  const tx = typeof transaction === 'string' ? decode(transaction) : transaction
  if (typeof tx === 'string') {
    return false
  }
  if (tx.Signers != null) {
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- we know that tx.Signers is an array of Signers
    const signers = tx.Signers as Signer[]
    for (const signer of signers) {
      // eslint-disable-next-line max-depth -- necessary for checking if signer is signed
      if (
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- necessary check
        signer.Signer.SigningPubKey == null ||
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- necessary check
        signer.Signer.TxnSignature == null
      ) {
        return false
      }
    }
    return true
  }
  return tx.SigningPubKey != null && tx.TxnSignature != null
}

// initializes a transaction for a submit request
async function getSignedTx(
  client: Client,
  transaction: Transaction | string,
  {
    autofill = true,
    wallet,
  }: {
    // If true, autofill a transaction.
    autofill?: boolean
    // If true, and the transaction fails locally, do not retry or relay the transaction to other servers.
    failHard?: boolean
    // A wallet to sign a transaction. It must be provided when submitting an unsigned transaction.
    wallet?: Wallet
  } = {},
): Promise<Transaction | string> {
  if (isSigned(transaction)) {
    return transaction
  }

  if (!wallet) {
    throw new ValidationError(
      'Wallet must be provided when submitting an unsigned transaction',
    )
  }

  let tx =
    typeof transaction === 'string'
      ? // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- converts JsonObject to correct Transaction type
        (decode(transaction) as unknown as Transaction)
      : transaction

  if (autofill) {
    tx = await client.autofill(tx)
  }

  return wallet.sign(tx).tx_blob
}

// checks if there is a LastLedgerSequence as a part of the transaction
function getLastLedgerSequence(
  transaction: Transaction | string,
): number | null {
  const tx = typeof transaction === 'string' ? decode(transaction) : transaction
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- converts LastLedgSeq to number if present.
  return tx.LastLedgerSequence as number | null
}

// checks if the transaction is an AccountDelete transaction
function isAccountDelete(transaction: Transaction | string): boolean {
  const tx = typeof transaction === 'string' ? decode(transaction) : transaction
  return tx.TransactionType === 'AccountDelete'
}

export { submit, submitAndWait }
