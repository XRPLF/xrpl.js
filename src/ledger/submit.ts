import { decode, encode } from 'ripple-binary-codec'

import type { Client, SubmitRequest, SubmitResponse, Wallet } from '..'
import { ValidationError } from '../common/errors'
import { Transaction } from '../models/transactions'
import { sign } from '../wallet/signer'

import autofill from './autofill'

/**
 * Submits an unsigned transaction.
 * Steps performed on a transaction:
 *    1. Autofill.
 *    2. Sign & Encode.
 *    3. Submit.
 *
 * @param client - A Client.
 * @param wallet - A Wallet to sign a transaction.
 * @param transaction - A transaction to autofill, sign & encode, and submit.
 * @returns A promise that contains SubmitResponse.
 * @throws RippledError if submit request fails.
 */
async function submitTransaction(
  client: Client,
  wallet: Wallet,
  transaction: Transaction,
): Promise<SubmitResponse> {
  // TODO: replace with client.autofill(transaction) once prepend refactor is fixed.
  const tx = await autofill(client, transaction)
  const signedTxEncoded = sign(wallet, tx)
  return submitSignedTransaction(client, signedTxEncoded)
}

/**
 * Encodes and submits a signed transaction.
 *
 * @param client - A Client.
 * @param signedTransaction - A signed transaction to encode (if not already) and submit.
 * @returns A promise that contains SubmitResponse.
 * @throws RippledError if submit request fails.
 */
async function submitSignedTransaction(
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
  }
  return client.request(request)
}

function isSigned(transaction: Transaction | string): boolean {
  const tx = typeof transaction === 'string' ? decode(transaction) : transaction
  return (
    typeof tx !== 'string' &&
    (tx.SigningPubKey != null || tx.TxnSignature != null)
  )
}

export { submitTransaction, submitSignedTransaction }
