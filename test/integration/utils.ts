import { assert } from 'chai'
import _ from 'lodash'
import { decode } from 'ripple-binary-codec'

import { Client, Wallet, Response } from 'xrpl-local'
import { Payment, Transaction } from 'xrpl-local/models/transactions'
import { computeSignedTransactionHash } from 'xrpl-local/utils/hashes'

const masterAccount = 'rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh'
const masterSecret = 'snoPBrXtMeMyMHUVTgbuqAfg1SUTb'

export async function ledgerAccept(client: Client): Promise<void> {
  const request = { command: 'ledger_accept' }
  await client.connection.request(request)
}

export async function fundAccount(
  client: Client,
  wallet: Wallet,
): Promise<void> {
  const payment: Payment = {
    TransactionType: 'Payment',
    Account: masterAccount,
    Destination: wallet.getClassicAddress(),
    // 2 times the amount needed for a new account (20 XRP)
    Amount: '400000000',
  }
  const response = await client.submitTransaction(
    Wallet.fromSeed(masterSecret),
    payment,
  )
  if (response.result.engine_result !== 'tesSUCCESS') {
    // eslint-disable-next-line no-console -- happens only when something goes wrong
    console.log(response)
    assert.fail(`Response not successful, ${response.result.engine_result}`)
  }

  await ledgerAccept(client)
}

export async function generateFundedWallet(client: Client): Promise<Wallet> {
  const wallet = Wallet.generate()
  await fundAccount(client, wallet)
  return wallet
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

export function verifySuccessfulResponse(response: Response): void {
  assert.equal(response.status, 'success')
  assert.equal(response.type, 'response')
}

export async function testTransaction(
  client: Client,
  transaction: Transaction,
  wallet: Wallet,
): Promise<void> {
  // Accept any un-validated changes.
  await ledgerAccept(client)

  // sign/submit the transaction
  const response = await client.submitTransaction(wallet, transaction)

  // check that the transaction was successful
  assert.equal(response.status, 'success')
  assert.equal(response.type, 'response')
  assert.equal(
    response.result.engine_result,
    'tesSUCCESS',
    response.result.engine_result_message,
  )

  // check that the transaction is on the ledger
  const signedTx = _.omit(response.result.tx_json, 'hash')
  await ledgerAccept(client)
  await verifySubmittedTransaction(client, signedTx as Transaction)
}
