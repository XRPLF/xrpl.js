import { assert } from 'chai'
import _ from 'lodash'
import { decode } from 'ripple-binary-codec'
import { Client, Wallet, AccountInfoRequest } from 'xrpl-local'
import { Payment, Transaction } from 'xrpl-local/models/transactions'
import { hashSignedTx } from 'xrpl-local/utils/hashes'

const masterAccount = 'rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh'
const masterSecret = 'snoPBrXtMeMyMHUVTgbuqAfg1SUTb'

export async function ledgerAccept(client: Client): Promise<void> {
  const request = { command: 'ledger_accept' }
  await client.connection.request(request)
}

export function subscribeDone(client: Client, done: Mocha.Done): void {
  client.removeAllListeners()
  done()
}

export async function fundAccount(
  client: Client,
  wallet: Wallet,
): Promise<void> {
  const payment: Payment = {
    TransactionType: 'Payment',
    Account: masterAccount,
    Destination: wallet.classicAddress,
    // 2 times the amount needed for a new account (20 XRP)
    Amount: '400000000',
  }
  const response = await client.submit(payment, {
    wallet: Wallet.fromSeed(masterSecret),
  })
  if (response.result.engine_result !== 'tesSUCCESS') {
    // eslint-disable-next-line no-console -- happens only when something goes wrong
    console.log(response)
    assert.fail(`Response not successful, ${response.result.engine_result}`)
  }
  await ledgerAccept(client)
  const signedTx = _.omit(response.result.tx_json, 'hash')
  await verifySubmittedTransaction(client, signedTx as Transaction)
}

export async function generateFundedWallet(client: Client): Promise<Wallet> {
  const wallet = Wallet.generate()
  await fundAccount(client, wallet)
  return wallet
}

export async function verifySubmittedTransaction(
  client: Client,
  tx: Transaction | string,
  hashTx?: string,
): Promise<void> {
  const hash = hashTx ?? hashSignedTx(tx)
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
): Promise<void> {
  // Accept any un-validated changes.
  await ledgerAccept(client)

  // sign/submit the transaction
  const response = await client.submit(transaction, { wallet })

  // check that the transaction was successful
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

export async function getXRPBalance(
  client: Client,
  wallet: Wallet,
): Promise<string> {
  const request: AccountInfoRequest = {
    command: 'account_info',
    account: wallet.classicAddress,
  }
  return (await client.request(request)).result.account_data.Balance
}
