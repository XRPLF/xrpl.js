import { decode, encode } from 'ripple-binary-codec'

import type { Client, SubmitRequest, SubmitResponse, Wallet } from '..'
import { ValidationError, XrplError } from '../errors'
import { TxResponse } from '../models/methods'
import { Transaction } from '../models/transactions'
import { hashes } from '../utils'

/** Approximate time for a ledger to close, in milliseconds */
const LEDGER_CLOSE_TIME = 4000

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

interface SubmitOptions {
  // If true, autofill a transaction.
  autofill?: boolean
  // If true, and the transaction fails locally, do not retry or relay the transaction to other servers.
  failHard?: boolean
  // A wallet to sign a transaction. It must be provided when submitting an unsigned transaction.
  wallet?: Wallet
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
  opts?: SubmitOptions,
): Promise<SubmitResponse> {
  const signedTx = await getSignedTx(this, transaction, opts)
  return submitRequest(this, signedTx, opts?.failHard)
}

/**
 * Asynchronously submits a transaction and verifies that it has been included in a
 * validated ledger (or has errored/will not be included for some reason).
 * See [Reliable Transaction Submission](https://xrpl.org/reliable-transaction-submission.html).
 *
 * @param this - A Client.
 * @param transaction - A transaction to autofill, sign & encode, and submit.
 * @param opts - (Optional) Options used to sign and submit a transaction.
 * @param opts.autofill - If true, autofill a transaction.
 * @param opts.failHard - If true, and the transaction fails locally, do not retry or relay the transaction to other servers.
 * @param opts.wallet - A wallet to sign a transaction. It must be provided when submitting an unsigned transaction.
 * @returns A promise that contains TxResponse, that will return when the transaction has been validated.
 */
async function submitAndWait(
  this: Client,
  transaction: Transaction | string,
  opts?: SubmitOptions,
): Promise<TxResponse> {
  const signedTx = await getSignedTx(this, transaction, opts)

  if (!hasLastLedgerSequence(signedTx)) {
    throw new ValidationError(
      'Transaction must contain a LastLedgerSequence value for reliable submission.',
    )
  }

  await submitRequest(this, signedTx, opts?.failHard)

  const txHash = hashes.hashSignedTx(signedTx)
  return waitForFinalTransactionOutcome(this, txHash)
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
async function waitForFinalTransactionOutcome(
  client: Client,
  txHash: string,
): Promise<TxResponse> {
  await sleep(LEDGER_CLOSE_TIME)

  const txResponse = await client.request({
    command: 'tx',
    transaction: txHash,
  })
  if (txResponse.result.validated) {
    return txResponse
  }

  const txLastLedger = txResponse.result.LastLedgerSequence
  if (txLastLedger == null) {
    throw new XrplError('LastLedgerSequence cannot be null')
  }
  const latestLedger = await client.getLedgerIndex()

  if (txLastLedger > latestLedger) {
    return waitForFinalTransactionOutcome(client, txHash)
  }

  throw new XrplError(
    `The latest ledger sequence ${latestLedger} is greater than the transaction's LastLedgerSequence (${txLastLedger}).`,
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
  { autofill = true, wallet }: SubmitOptions = {},
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
function hasLastLedgerSequence(transaction: Transaction | string): boolean {
  const tx = typeof transaction === 'string' ? decode(transaction) : transaction
  return typeof tx !== 'string' && tx.LastLedgerSequence != null
}

// checks if the transaction is an AccountDelete transaction
function isAccountDelete(transaction: Transaction | string): boolean {
  const tx = typeof transaction === 'string' ? decode(transaction) : transaction
  return tx.TransactionType === 'AccountDelete'
}

export { submit, submitAndWait }
