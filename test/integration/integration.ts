/* eslint-disable no-console -- temporary until later */
/* eslint-disable max-params -- helper test functions */
import assert from 'assert'

import _ from 'lodash'
import { encode } from 'ripple-binary-codec'

import { Client, SubmitResponse, Wallet } from 'xrpl-local'
import {
  AccountSet,
  OfferCreate,
  SignerListSet,
  TrustSet,
  Transaction,
} from 'xrpl-local/models/transactions'
import {
  generateXAddress,
  xrpToDrops,
  convertStringToHex,
} from 'xrpl-local/utils'
import { computeSignedTransactionHash } from 'xrpl-local/utils/hashes'
import { sign, multisign } from 'xrpl-local/wallet/signer'

import serverUrl from './serverUrl'
import { payTo, ledgerAccept } from './utils'
import { walletAddress, walletSecret } from './wallet'

// how long before each test case times out
const TIMEOUT = 20000

console.log(serverUrl)

async function submitTransaction(
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

async function verifyTransaction(
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

async function testTransaction(
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

async function setup(this: TestCase, server = serverUrl): Promise<void> {
  this.client = new Client(server)
  console.log('CONNECTING...')
  return this.client.connect().then(
    () => {
      console.log('CONNECTED...')
    },
    (error) => {
      console.log('ERROR:', error)
      throw error
    },
  )
}

const masterAccount = 'rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh'
const masterSecret = 'snoPBrXtMeMyMHUVTgbuqAfg1SUTb'

async function makeTrustLine(
  testcase: TestCase,
  address: string,
  secret: string,
) {
  const client: Client = testcase.client
  const trustSet: TrustSet = {
    TransactionType: 'TrustSet',
    Account: address,
    LimitAmount: {
      value: '1341.1',
      issuer: masterAccount,
      currency: 'USD',
    },
    Flags: 0x00020000,
  }
  const response = await submitTransaction(client, secret, trustSet)
  if (
    response.result.engine_result !== 'tesSUCCESS' &&
    response.result.engine_result !== 'tecPATH_PARTIAL'
  ) {
    console.log(response)
    assert.fail(`Response not successful, ${response.result.engine_result}`)
  }
  ledgerAccept(client)
}

async function makeOrder(
  client: Client,
  offerCreate: OfferCreate,
  secret: string,
): Promise<void> {
  const response = await submitTransaction(client, secret, offerCreate)
  if (
    response.result.engine_result !== 'tesSUCCESS' &&
    response.result.engine_result !== 'tecPATH_PARTIAL'
  ) {
    console.log(response)
    assert.fail(`Response not successful, ${response.result.engine_result}`)
  }
  ledgerAccept(client)
}

async function setupAccounts(testcase: TestCase): Promise<void> {
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
  await makeTrustLine(testcase, walletAddress, walletSecret)
  await makeTrustLine(
    testcase,
    testcase.newWallet.xAddress,
    testcase.newWallet.secret,
  )
  await payTo(client, walletAddress, '123', 'USD', masterAccount)
  await payTo(client, 'rMwjYedjc7qqtKYVLiAccJSmCwih4LnE2q')
  const offerCreate: OfferCreate = {
    TransactionType: 'OfferCreate',
    Account: testcase.newWallet.xAddress,
    TakerPays: {
      currency: 'USD',
      value: '432',
      issuer: masterAccount,
    },
    TakerGets: xrpToDrops('432'),
  }
  await makeOrder(testcase.client, offerCreate, testcase.newWallet.secret)
  const offerCreate2: OfferCreate = {
    TransactionType: 'OfferCreate',
    Account: masterAccount,
    TakerPays: xrpToDrops('1741'),
    TakerGets: {
      currency: 'USD',
      value: '171',
      issuer: masterAccount,
    },
  }
  await makeOrder(testcase.client, offerCreate2, masterSecret)
}

async function teardown(this: TestCase): Promise<void> {
  return this.client.disconnect()
}

async function suiteSetup(this: any) {
  this.transactions = []

  return (
    setup
      .bind(this)(serverUrl)
      .then(async () => ledgerAccept(this.client))
      .then(
        () =>
          (this.newWallet = generateXAddress({ includeClassicAddress: true })),
      )
      // two times to give time to server to send `ledgerClosed` event
      // so getLedgerVersion will return right value
      .then(async () => ledgerAccept(this.client))
      .then(() =>
        this.client
          .request({
            command: 'ledger',
            ledger_index: 'validated',
          })
          .then((response) => response.result.ledger_index),
      )
      .then((ledgerVersion) => {
        this.startLedgerVersion = ledgerVersion
      })
      .then(async () => setupAccounts(this))
      .then(async () => teardown.bind(this)())
  )
}

describe('integration tests', function () {
  this.timeout(TIMEOUT)

  before(suiteSetup)
  beforeEach(_.partial(setup, serverUrl))
  afterEach(teardown)

  it('isConnected', function () {
    assert(this.client.isConnected())
  })

  const multisignAccount = 'r5nx8ZkwEbFztnc8Qyi22DE9JYjRzNmvs'
  const multisignSecret = 'ss6F8381Br6wwpy9p582H8sBt19J3'
  const signer1address = 'rQDhz2ZNXmhxzCYwxU6qAbdxsHA4HV45Y2'
  const signer1secret = 'shK6YXzwYfnFVn3YZSaMh5zuAddKx'
  const signer2address = 'r3RtUvGw9nMoJ5FuHxuoVJvcENhKtuF9ud'
  const signer2secret = 'shUHQnL4EH27V4EiBrj6EfhWvZngF'

  it('submit multisigned transaction', async function () {
    const client: Client = this.client
    const signerListSet: SignerListSet = {
      TransactionType: 'SignerListSet',
      Account: multisignAccount,
      SignerEntries: [
        {
          SignerEntry: {
            Account: signer1address,
            SignerWeight: 1,
          },
        },
        {
          SignerEntry: {
            Account: signer2address,
            SignerWeight: 1,
          },
        },
      ],
      SignerQuorum: 2,
    }
    const serverInfoResponse = await client.request({
      command: 'server_info',
    })
    const fundAmount = xrpToDrops(
      Number(
        serverInfoResponse.result.info.validated_ledger?.reserve_base_xrp,
      ) * 2,
    )
    await payTo(client, multisignAccount, fundAmount)
    const minLedgerVersion = (
      await client.request({
        command: 'ledger',
        ledger_index: 'validated',
      })
    ).result.ledger_index
    const tx = await client.autofill(signerListSet, 2)
    await testTransaction(
      this,
      'SignerListSet',
      minLedgerVersion,
      tx,
      multisignAccount,
      multisignSecret,
    )
    const accountSet: AccountSet = {
      TransactionType: 'AccountSet',
      Account: multisignAccount,
      Domain: convertStringToHex('example.com'),
    }
    const accountSetTx = await client.autofill(accountSet, 2)
    const signed1 = sign(Wallet.fromSeed(signer1secret), accountSetTx, true)
    const signed2 = sign(Wallet.fromSeed(signer2secret), accountSetTx, true)
    const combined = multisign([signed1, signed2])
    const submitResponse = await client.request({
      command: 'submit',
      tx_blob: encode(combined),
    })
    await ledgerAccept(client)
    assert.strictEqual(submitResponse.result.engine_result, 'tesSUCCESS')
    const options = { minLedgerVersion }
    return verifyTransaction(
      this,
      computeSignedTransactionHash(combined),
      'AccountSet',
      options,
      multisignAccount,
    ).catch((error) => {
      console.log(error.message)
      throw error
    })
  })
})
