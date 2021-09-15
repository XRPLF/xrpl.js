/* eslint-disable max-params -- helper test functions */
import { assert } from 'chai'
import _ from 'lodash'
import { decode } from 'ripple-binary-codec'

import { Client, SubmitResponse, Wallet } from 'xrpl-local'
import {
  validatePayment,
  Payment,
  Transaction,
} from 'xrpl-local/models/transactions'
import { computeSignedTransactionHash } from 'xrpl-local/utils/hashes'
import { sign } from 'xrpl-local/wallet/signer'

const masterAccount = 'rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh'
const masterSecret = 'snoPBrXtMeMyMHUVTgbuqAfg1SUTb'

export async function ledgerAccept(client: Client): Promise<void> {
  const request = { command: 'ledger_accept' }
  await client.connection.request(request)
}

// TODO: replace with `client.submitTransaction` once that has been merged
export async function submitTransaction(
  client: Client,
  secret: string,
  transaction: Transaction,
): Promise<SubmitResponse> {
  const wallet = Wallet.fromSeed(secret)
  const tx = await client.autofill(transaction)
  const signedTxEncoded: string = sign(wallet, tx)
  return client.request({ command: 'submit', tx_blob: signedTxEncoded })
}

export async function fundAccount(
  client: Client,
  account: string,
): Promise<void> {
  const payment: Payment = {
    TransactionType: 'Payment',
    Account: masterAccount,
    Destination: account,
    // 2 times the amount needed for a new account (20 XRP)
    Amount: '400000000',
  }
  const paymentTx = await client.autofill(payment)
  validatePayment(paymentTx)

  const response = await submitTransaction(client, masterSecret, paymentTx)
  if (response.result.engine_result !== 'tesSUCCESS') {
    // eslint-disable-next-line no-console -- happens only when something goes wrong
    console.log(response)
    assert.fail(`Response not successful, ${response.result.engine_result}`)
  }

  await ledgerAccept(client)
}

export async function verifySubmittedTransaction(
  client: Client,
  tx: Transaction | string,
): Promise<void> {
  const hash = computeSignedTransactionHash(tx)
  const data = await client.request({
    command: 'tx',
    transaction: hash,
  })

  assert(data.result)
  assert.deepEqual(
    _.omit(data.result, [
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

export async function testTransaction(
  client: Client,
  transaction: Transaction,
  wallet: Wallet,
  accountNeedsFunds: boolean = true,
): Promise<void> {
  if (accountNeedsFunds) await fundAccount(client, wallet.getClassicAddress())
  // sign/submit the transaction
  const response = await client.submitTransaction(wallet, transaction)

  // check that the transaction was successful
  assert.equal(response.status, 'success')
  assert.equal(response.type, 'response')
  assert.equal(response.result.engine_result, 'tesSUCCESS')

  // check that the transaction is on the ledger
  const signedTx = _.omit(response.result.tx_json, 'hash')
  await ledgerAccept(client)
  await verifySubmittedTransaction(client, signedTx as Transaction)
}
