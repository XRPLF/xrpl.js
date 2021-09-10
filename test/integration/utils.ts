import { assert } from 'chai'

import { Client, SubmitResponse, Wallet, xrpToDrops } from 'xrpl-local'
import { BaseResponse } from 'xrpl-local/models/methods/baseMethod'
import {
  verifyPayment,
  Payment,
  Transaction,
  AccountSet,
} from 'xrpl-local/models/transactions'
import { computeSignedTransactionHash } from 'xrpl-local/utils/hashes'
import { sign } from 'xrpl-local/wallet/signer'

import { walletAddress, walletSecret } from './wallet'

const masterAccount = 'rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh'
const masterSecret = 'snoPBrXtMeMyMHUVTgbuqAfg1SUTb'

interface LedgerAcceptResponse extends BaseResponse {
  result: {
    ledger_current_index: number
  }
}

export async function ledgerAccept(
  client: Client,
): Promise<LedgerAcceptResponse> {
  const request = { command: 'ledger_accept' }
  return client.connection.request(request) as Promise<LedgerAcceptResponse>
}

// eslint-disable-next-line max-params -- helper test function
export async function pay(
  client: Client,
  from: string,
  to: string,
  amount: string,
  secret: string,
  issuer: string,
  currency = 'XRP',
): Promise<string> {
  const paymentAmount =
    currency === 'XRP' ? amount : { value: amount, currency, issuer }

  const payment: Payment = {
    TransactionType: 'Payment',
    Account: from,
    Destination: to,
    Amount: paymentAmount,
  }

  const paymentTx = await client.autofill(payment, 1)
  verifyPayment(paymentTx)
  const signed = client.sign(JSON.stringify(paymentTx), secret)
  const id = signed.id
  const response = await client.request({
    command: 'submit',
    tx_blob: signed.signedTransaction,
  })
  // TODO: add better error handling here
  // TODO: fix path issues
  if (
    response.result.engine_result !== 'tesSUCCESS' &&
    response.result.engine_result !== 'tecPATH_PARTIAL'
  ) {
    console.log(response)
    assert.fail(`Response not successful, ${response.result.engine_result}`)
  }
  ledgerAccept(client)
  return id
}

// eslint-disable-next-line max-params -- Helper test function
export async function payTo(
  client: Client,
  to: string,
  amount = '40000000',
  currency = 'XRP',
  issuer = '',
): Promise<string> {
  return pay(client, masterAccount, to, amount, masterSecret, issuer, currency)
}

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

type TestCase = Mocha.Context

export async function verifyTransaction(
  testcase: TestCase,
  hash: string,
  type: string,
  options: { minLedgerVersion: number; maxLedgerVersion?: number },
  account: string,
): Promise<void> {
  console.log('VERIFY...')
  const data = await testcase.client.request({
    command: 'tx',
    transaction: hash,
    min_ledger: options.minLedgerVersion,
    max_ledger: options.maxLedgerVersion,
  })

  assert(data.result)
  assert.strictEqual(data.result.TransactionType, type)
  assert.strictEqual(data.result.Account, account)
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
  testcase: TestCase,
  type: string,
  lastClosedLedgerVersion: number,
  txData: Transaction,
  address = walletAddress,
  secret = walletSecret,
): Promise<void> {
  assert.strictEqual(txData.Account, address)
  const client: Client = testcase.client
  const signedData = sign(Wallet.fromSeed(secret), txData)
  console.log('PREPARED...')

  const attemptedResponse = await client.request({
    command: 'submit',
    tx_blob: signedData,
  })
  const submittedResponse = testcase.test?.title.includes('multisign')
    ? await ledgerAccept(client).then(() => attemptedResponse)
    : attemptedResponse

  console.log('SUBMITTED...')
  assert.strictEqual(submittedResponse.result.engine_result, 'tesSUCCESS')
  const options = {
    minLedgerVersion: lastClosedLedgerVersion,
    maxLedgerVersion: txData.LastLedgerSequence,
  }
  await ledgerAccept(testcase.client)
  await verifyTransaction(
    testcase,
    computeSignedTransactionHash(signedData),
    type,
    options,
    address,
  )
}

export async function setupAccounts(testcase: TestCase): Promise<void> {
  const client = testcase.client

  const serverInfoResponse = await client.request({ command: 'server_info' })
  const fundAmount = xrpToDrops(
    Number(serverInfoResponse.result.info.validated_ledger?.reserve_base_xrp) *
      2,
  )
  await payTo(client, 'rMH4UxPrbuMa1spCBR98hLLyNJp4d8p4tM', fundAmount)
  await payTo(client, walletAddress, fundAmount)
  await payTo(client, testcase.newWallet.classicAddress, fundAmount)
  await payTo(client, 'rKmBGxocj9Abgy25J51Mk1iqFzW9aVF9Tc', fundAmount)
  await payTo(client, 'rMwjYedjc7qqtKYVLiAccJSmCwih4LnE2q', fundAmount)

  const accountSet: AccountSet = {
    TransactionType: 'AccountSet',
    Account: masterAccount,
    // default ripple
    SetFlag: 8,
  }
  await submitTransaction(client, masterSecret, accountSet)
  await ledgerAccept(client)
  await payTo(client, walletAddress, '123', 'USD', masterAccount)
  await payTo(client, 'rMwjYedjc7qqtKYVLiAccJSmCwih4LnE2q')
}
