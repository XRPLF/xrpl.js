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

import { walletAddress, walletSecret } from './wallet'

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
  testcase: Mocha.Context,
  tx: Transaction,
  options: { minLedgerVersion: number; maxLedgerVersion?: number },
): Promise<void> {
  const hash = computeSignedTransactionHash(tx)
  const data = await testcase.client.request({
    command: 'tx',
    transaction: hash,
    min_ledger: options.minLedgerVersion,
    max_ledger: options.maxLedgerVersion,
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
    tx,
  )
  if (typeof data.result.meta === 'object') {
    assert.strictEqual(data.result.meta.TransactionResult, 'tesSUCCESS')
  } else {
    assert.strictEqual(data.result.meta, 'tesSUCCESS')
  }
  if (testcase.transactions != null) {
    testcase.transactions.push(hash)
  }
}

export async function testTransaction(
  testcase: Mocha.Context,
  lastClosedLedgerVersion: number,
  txData: Transaction,
  address = walletAddress,
  secret = walletSecret,
): Promise<void> {
  assert.strictEqual(txData.Account, address)
  const client: Client = testcase.client
  const signedData = sign(Wallet.fromSeed(secret), txData)

  const attemptedResponse = await client.request({
    command: 'submit',
    tx_blob: signedData,
  })
  const submittedResponse = testcase.test?.title.includes('multisign')
    ? await ledgerAccept(client).then(() => attemptedResponse)
    : attemptedResponse

  assert.strictEqual(submittedResponse.result.engine_result, 'tesSUCCESS')
  const options = {
    minLedgerVersion: lastClosedLedgerVersion,
    maxLedgerVersion: txData.LastLedgerSequence,
  }
  await ledgerAccept(testcase.client)
  await verifySubmittedTransaction(
    testcase,
    decode(signedData) as unknown as Transaction,
    options,
  )
}
