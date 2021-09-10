import { encode } from 'ripple-binary-codec'

import type { Client, SubmitRequest, SubmitResponse, Wallet } from '..'
import { RippledError } from '../common/errors'
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
 * @param transaction - A transaction to submit.
 * @returns A promise.
 * @throws RippledError if submit request fails.
 */
async function submitTransaction(
  client: Client,
  wallet: Wallet,
  transaction: Transaction,
): Promise<void> {
  const tx: Transaction = await autofill(client, transaction)
  const signedTxSerialized: string = sign(wallet, tx)
  return submitRequest(client, signedTxSerialized)
}

/**
 * Encodes and submits a signed transaction.
 *
 * @param client - A Client.
 * @param signedTransaction - A signed transaction to submit.
 * @returns A promise.
 * @throws RippledError if submit request fails.
 */
async function submitSignedTransaction(
  client: Client,
  signedTransaction: Transaction,
): Promise<void> {
  const serialized = encode(signedTransaction)
  return submitRequest(client, serialized)
}

async function submitRequest(
  client: Client,
  txSerialized: string,
): Promise<void> {
  const request: SubmitRequest = {
    command: 'submit',
    tx_blob: txSerialized,
  }
  const response: SubmitResponse = await client.request(request)
  if (response.result.engine_result !== 'tesSUCCESS') {
    throw new RippledError(response.result.engine_result_message)
  }
}

export { submitTransaction, submitSignedTransaction }
