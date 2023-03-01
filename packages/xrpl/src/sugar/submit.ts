import { decode, encode } from 'ripple-binary-codec'

import type { Client, SubmitRequest, SubmitResponse, Wallet } from '..'
import { ValidationError, XrplError } from '../errors'
import { TxResponse } from '../models/methods'
import { Transaction } from '../models/transactions'
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
 *   const senderWallet = Wallet.generate()
 *   const recipientWallet = Wallet.generate()
 *
 *   const transaction = {
 *     TransactionType: 'Payment',
 *     Account: senderWallet.address,
 *     Destination: recipientWallet.address,
 *     Amount: '10'
 *   }
 *
 *   try {
 *     await client.autofill(transaction)
 *     const signedTransaction = await Wallet.sign(transaction)
 *     const result = await client.submitAndWait(signedTransaction)
 *     console.log(result)
 *   } catch (error) {
 *     console.error(`Failed to submit transaction: ${error}`)
 *   }
 * }
 *
 * submitTransaction()
 * ```
 *
 * In this example, we create two new random wallets using the generate() method of the Wallet class,
 * one for the sender and one for the recipient. We extract the publicKey property from the generated wallet
 * objects to get the sender and recipient public keys.
 *
 * Next we create a transaction object that represents a payment of 10 XRP from the sender account to the
 * recipient account. We set the Amount property to 10 XRP and leave the other properties empty.
 *
 * The transaction object is passed to the `autofill()` method of the `Client` class, which fills in the
 * missing fields based on the current state of the XRP Ledger.
 *
 * Continuing on we then pass the filled-in transaction object to the `sign()` method of the `Wallet` class
 * using `await` to wait for the method to complete. If the signing is successful, the resulting signed
 * transaction blob is passed to the `submitAndWait()` method of the `Client` class.
 *
 * The `submitAndWait()` method submits the signed transaction blob to the XRP Ledger and waits for the transaction
 * to be included in a validated ledger before resolving or rejecting the returned promise. If the transaction is
 * successfully validated and included in a ledger, the promise resolves with the transaction result object. If there's
 * an issue submitting or validating the transaction, the promise rejects with an error.
 *
 * If the promise resolves, the function logs a success message to the console that includes the transaction hash. If the
 * promise rejects, the function logs an error message to the console using console.error().
 *
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
async function submitAndWait(
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
): Promise<TxResponse> {
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
async function waitForFinalTransactionOutcome(
  client: Client,
  txHash: string,
  lastLedger: number,
  submissionResult: string,
): Promise<TxResponse> {
  await sleep(LEDGER_CLOSE_TIME)

  const latestLedger = await client.getLedgerIndex()

  if (lastLedger < latestLedger) {
    throw new XrplError(
      `The latest ledger sequence ${latestLedger} is greater than the transaction's LastLedgerSequence (${lastLedger}).\n` +
        `Preliminary result: ${submissionResult}`,
    )
  }

  const txResponse = await client
    .request({
      command: 'tx',
      transaction: txHash,
    })
    .catch(async (error) => {
      // error is of an unknown type and hence we assert type to extract the value we need.
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions,@typescript-eslint/no-unsafe-member-access -- ^
      const message = error?.data?.error as string
      if (message === 'txnNotFound') {
        return waitForFinalTransactionOutcome(
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

  return waitForFinalTransactionOutcome(
    client,
    txHash,
    lastLedger,
    submissionResult,
  )
}

// checks if the transaction has been signed
function isSigned(transaction: Transaction | string): boolean {
  const tx = typeof transaction === 'string' ? decode(transaction) : transaction
  return (
    typeof tx !== 'string' &&
    (tx.SigningPubKey != null || tx.TxnSignature != null)
  )
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
