import { decode, encode } from 'ripple-binary-codec'

import type { Client, SubmitRequest, SubmitResponse, Wallet } from '..'
import { ValidationError } from '../errors'
import { Transaction } from '../models/transactions'
import { sign } from '../wallet/signer'

/**
 * Submits an unsigned transaction.
 * Steps performed on a transaction:
 *    1. Autofill.
 *    2. Sign & Encode.
 *    3. Submit.
 *
 * @param this - A Client.
 * @param wallet - A Wallet to sign a transaction.
 * @param transaction - A transaction to autofill, sign & encode, and submit.
 * @returns A promise that contains SubmitResponse.
 * @throws RippledError if submit request fails.
 */
async function submitTransaction(
  this: Client,
  wallet: Wallet,
  transaction: Transaction,
): Promise<SubmitResponse> {
  const tx = await this.autofill(transaction)
  const signedTxEncoded = sign(wallet, tx)
  return this.submitSignedTransaction(signedTxEncoded)
}

/**
 * Encodes and submits a signed transaction.
 *
 * @param this - A Client.
 * @param signedTransaction - A signed transaction to encode (if not already) and submit.
 * @returns A promise that contains SubmitResponse.
 * @throws RippledError if submit request fails.
 */
async function submitSignedTransaction(
  this: Client,
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
  return this.request(request)
}

function isSigned(transaction: Transaction | string): boolean {
  const tx = typeof transaction === 'string' ? decode(transaction) : transaction
  return (
    typeof tx !== 'string' &&
    (tx.SigningPubKey != null || tx.TxnSignature != null)
  )
}

function isAccountDelete(transaction: Transaction | string): boolean {
  const tx = typeof transaction === 'string' ? decode(transaction) : transaction
  return tx.TransactionType === 'AccountDelete'
}

export { submitTransaction, submitSignedTransaction }
