import type { Client, SubmitRequest, SubmitResponse, Wallet } from '..'
import { RippledError } from '../common/errors'
import { Transaction } from '../models/transactions'
import { sign } from '../wallet/signer'

import autofill from './autofill'

/**
 * Submits a transaction.
 *
 * @param client - A client.
 * @param wallet - A Wallet.
 * @param transaction - A transaction to submit.
 * @throws RippledError if submit request fails.
 */
async function submitTransaction(
  client: Client,
  wallet: Wallet,
  transaction: Transaction,
): Promise<void> {
  const tx: Transaction = await autofill(client, transaction)
  const signedTxBlob: string = sign(wallet, tx)
  const request: SubmitRequest = {
    command: 'submit',
    tx_blob: signedTxBlob,
  }
  const response: SubmitResponse = await client.request(request)
  if (response.result.engine_result !== 'tesSUCCESS') {
    throw new RippledError(response.result.engine_result_message)
  }
}

export default submitTransaction
