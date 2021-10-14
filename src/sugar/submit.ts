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
  autofill?: boolean
  failHard?: boolean
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
 * @param opts - A Wallet to sign a transaction and a boolean to autofill transaction.
 * @returns A promise that contains SubmitResponse.
 * @throws RippledError if submit request fails.
 */
async function submit(
  this: Client,
  transaction: Transaction | string,
  { autofill = true, wallet }: SubmitOptions = {},
): Promise<SubmitResponse> {
  let signedTx = transaction
  if (!isSigned(transaction)) {
    if (!wallet) {
      throw new ValidationError('Missing wallet to sign transaction')
    }

    let tx =
      typeof transaction === 'string'
        ? // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- this is expected
          (decode(transaction) as unknown as Transaction)
        : transaction

    if (autofill) {
      tx = await this.autofill(tx)
    }

    const { tx_blob } = wallet.sign(tx)
    signedTx = tx_blob
  }

  return submitSigned(this, signedTx)
}

/**
 * Encodes and submits a signed transaction.
 *
 * @param client - A Client.
 * @param signedTransaction - A signed transaction to encode (if not already) and submit.
 * @returns A promise that contains SubmitResponse.
 * @throws ValidationError if the transaction isn't signed, RippledError if submit request fails.
 */
async function submitSigned(
  client: Client,
  signedTransaction: Transaction | string,
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
    fail_hard: isAccountDelete(signedTransaction),
  }
  return client.request(request)
}

/**
 * Asynchronously submits a transaction and verifies that it has been included in a
 * validated ledger (or has errored/will not be included for some reason).
 * See [Reliable Transaction Submission](https://xrpl.org/reliable-transaction-submission.html).
 *
 * @param this - A Client.
 * @param wallet - A Wallet to sign a transaction.
 * @param transaction - A transaction to autofill, sign & encode, and submit.
 * @returns A promise that contains TxResponse, that will return when the transaction has been validated.
 */
async function submitReliable(
  this: Client,
  wallet: Wallet,
  transaction: Transaction,
): Promise<TxResponse> {
  const tx = await this.autofill(transaction)
  const { tx_blob } = wallet.sign(tx)
  return this.submitSignedReliable(tx_blob)
}

/**
 * Asynchronously submits a transaction and verifies that it has been included in a
 * validated ledger (or has errored/will not be included for some reason).
 * See [Reliable Transaction Submission](https://xrpl.org/reliable-transaction-submission.html).
 *
 * @param this - A Client.
 * @param signedTransaction - A signed transaction to encode (if not already) and submit.
 * @returns A promise that contains TxResponse, that will return when the transaction has been validated.
 * @throws ValidationError if the request is not signed/doesn't have a LastLedgerSequence, RippledError if the submit request
 *   fails, XrplError if the reliable submission fails.
 */
async function submitSignedReliable(
  this: Client,
  signedTransaction: Transaction | string,
): Promise<TxResponse> {
  if (!isSigned(signedTransaction)) {
    throw new ValidationError('Transaction must be signed')
  }
  if (!hasLastLedgerSequence(signedTransaction)) {
    throw new ValidationError(
      'Transaction must contain a LastLedgerSequence value for reliable submission.',
    )
  }

  const signedTxEncoded =
    typeof signedTransaction === 'string'
      ? signedTransaction
      : encode(signedTransaction)
  const txHash = hashes.hashSignedTx(signedTransaction)

  const request: SubmitRequest = {
    command: 'submit',
    tx_blob: signedTxEncoded,
    fail_hard: isAccountDelete(signedTransaction),
  }
  await this.request(request)

  return waitForFinalTransactionOutcome(this, txHash)
}

// Helper functions

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

export { submit, submitReliable, submitSignedReliable }
