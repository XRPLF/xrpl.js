import { assert } from 'chai'
import _ from 'lodash'
import { decode } from 'ripple-binary-codec'
import keypairs from 'ripple-keypairs'

import { Client, Wallet } from 'xrpl-local'
import { Payment, Transaction } from 'xrpl-local/models/transactions'
import {
  submitTransaction,
  // submitSignedTransaction,
} from 'xrpl-local/sugar/submit'
// import { sign } from 'xrpl-local/transaction/sign'
import { computeSignedTransactionHash } from 'xrpl-local/utils/hashes'

import {
  PaymentChannelCreate,
  SetRegularKey,
} from '../../src/models/transactions'

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
    assert.fail(
      `Response not successful, ${response.result.engine_result as string}`,
    )
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

export async function testTransaction(
  client: Client,
  transaction: Transaction,
  wallet: Wallet,
): Promise<void> {
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

export async function createChannel(
  client: Client,
  wallet: Wallet,
): Promise<void> {
  const keypair = keypairs.deriveKeypair(masterSecret)

  const tx: PaymentChannelCreate = {
    Amount: '40000000',
    Account: 'rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh',
    TransactionType: 'PaymentChannelCreate',
    Destination: 'rsA2LpzuawewSBQXkiju3YQTMzW13pAAdW',
    SettleDelay: 86400,
    PublicKey: keypair.publicKey,
  }
  // const tx = {
  //   command: 'sign',
  //   tx_json: {
  //     Amount: '40000000',
  //     Account: 'rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh',
  //     TransactionType: 'PaymentChannelCreate',
  //     Destination: 'rsA2LpzuawewSBQXkiju3YQTMzW13pAAdW',
  //     SettleDelay: 86400,
  //     PublicKey: keypair.publicKey,
  //   },
  //   secret: masterSecret,
  //   offline: false,
  //   fee_mult_max: 1000,
  // }
  setRegularKey(client, wallet)
  const signedTransaction = await submitTransaction(client, wallet, tx)
  // client.sign
  // const response = client.sign(tx, masterSecret)
  //   const signedTx = { ...signedTransaction }
  //   const response = await submitSignedTransaction(client, signedTx)
  //   console.log(response)
  console.log(signedTransaction)
}

async function setRegularKey(client: Client, wallet: Wallet) {
  const tx: SetRegularKey = {
    Flags: 0,
    TransactionType: 'SetRegularKey',
    Account: 'rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh',
    Fee: '12',
  }
  const response = await submitTransaction(client, wallet, tx)
  console.log(response)
}
