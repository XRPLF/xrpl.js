import assert from 'assert'

import _ from 'lodash'
import { isValidXAddress } from 'ripple-address-codec'

import { Client } from 'xrpl-local'
import {
  AccountSet,
  OfferCreate,
  SignerListSet,
  TrustSet,
} from 'xrpl-local/models/transactions'
import {
  isValidSecret,
  generateXAddress,
  xrpToDrops,
  convertStringToHex,
} from 'xrpl-local/utils'

// import requests from '../fixtures/requests'

import { payTo, ledgerAccept } from './utils'
import wallet from './wallet'

// how long before each test case times out
const TIMEOUT = 20000
const INTERVAL = 1000 // how long to wait between checks for validated ledger

const HOST = process.env.HOST ?? '0.0.0.0'
const PORT = process.env.PORT ?? '6006'
const serverUrl = `ws://${HOST}:${PORT}`

console.log(serverUrl)

function acceptLedger(client) {
  return client.connection.request({ command: 'ledger_accept' })
}

function verifyTransaction(testcase, hash, type, options, txData, account) {
  console.log('VERIFY...')
  return testcase.client
    .request({
      command: 'tx',
      transaction: hash,
      min_ledger: options.minLedgerVersion,
      max_ledger: options.maxLedgerVersion,
    })
    .then((data) => {
      assert(data && data.result)
      assert.strictEqual(data.result.TransactionType, type)
      assert.strictEqual(data.result.Account, account)
      assert.strictEqual(data.result.meta.TransactionResult, 'tesSUCCESS')
      if (testcase.transactions != null) {
        testcase.transactions.push(hash)
      }
      return { txJSON: JSON.stringify(txData), id: hash, tx: data }
    })
    .catch((error) => {
      console.log(error.stack)
      assert(false, `Transaction not successful: ${error.message}`)
    })
}

function testTransaction(
  testcase,
  type,
  lastClosedLedgerVersion,
  prepared,
  address = wallet.getAddress(),
  secret = wallet.getSecret(),
) {
  const txJSON = prepared.txJSON
  assert(txJSON, 'missing txJSON')
  const txData = JSON.parse(txJSON)
  assert.strictEqual(txData.Account, address)
  const signedData = testcase.client.sign(txJSON, secret)
  console.log('PREPARED...')
  return testcase.client
    .request({ command: 'submit', tx_blob: signedData.signedTransaction })
    .then((response) =>
      testcase.test.title.indexOf('multisign') !== -1
        ? acceptLedger(testcase.client).then(() => response)
        : response,
    )
    .then(async (response) => {
      console.log('SUBMITTED...')
      assert.strictEqual(response.result.engine_result, 'tesSUCCESS')
      const options = {
        minLedgerVersion: lastClosedLedgerVersion,
        maxLedgerVersion: txData.LastLedgerSequence,
      }
      ledgerAccept(testcase.client)
      return new Promise((resolve, reject) => {
        setTimeout(
          () =>
            verifyTransaction(
              testcase,
              signedData.id,
              type,
              options,
              txData,
              address,
            ).then(resolve, reject),
          INTERVAL,
        )
      })
    })
}

function setup(this: any, server = serverUrl) {
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

function makeTrustLine(testcase, address, secret) {
  const client = testcase.client
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
  const trust = client
    .autofill(trustSet)
    .then(async (tx) => {
      const signed = client.sign(JSON.stringify(tx), secret)
      if (address === wallet.getAddress()) {
        testcase.transactions.push(signed.id)
      }
      return client.request({
        command: 'submit',
        tx_blob: signed.signedTransaction,
      })
    })
    .then((response) => {
      if (
        response.result.engine_result !== 'tesSUCCESS' &&
        response.result.engine_result !== 'tecPATH_PARTIAL'
      ) {
        console.log(response)
        assert.fail(`Response not successful, ${response.result.engine_result}`)
      }
      ledgerAccept(client)
    })
  return trust
}

function makeOrder(client, offerCreate, secret) {
  return client
    .autofill(offerCreate)
    .then((tx) => client.sign(JSON.stringify(tx), secret))
    .then((signed) =>
      client.request({ command: 'submit', tx_blob: signed.signedTransaction }),
    )
    .then((response) => {
      if (
        response.result.engine_result !== 'tesSUCCESS' &&
        response.result.engine_result !== 'tecPATH_PARTIAL'
      ) {
        console.log(response)
        assert.fail(`Response not successful, ${response.result.engine_result}`)
      }
      ledgerAccept(client)
    })
}

function setupAccounts(testcase) {
  const client = testcase.client
  let fundAmount = '20'

  const promise = client
    .request({ command: 'server_info' })
    .then(
      (response) =>
        (fundAmount = xrpToDrops(
          Number(response.result.info.validated_ledger.reserve_base_xrp) * 2,
        )),
    )
    .then(() => payTo(client, 'rMH4UxPrbuMa1spCBR98hLLyNJp4d8p4tM', fundAmount))
    .then(() => payTo(client, wallet.getAddress(), fundAmount))
    .then(() => payTo(client, testcase.newWallet.classicAddress, fundAmount))
    .then(() => payTo(client, 'rKmBGxocj9Abgy25J51Mk1iqFzW9aVF9Tc', fundAmount))
    .then(() => payTo(client, 'rMwjYedjc7qqtKYVLiAccJSmCwih4LnE2q', fundAmount))
    .then(() => {
      const accountSet: AccountSet = {
        TransactionType: 'AccountSet',
        Account: masterAccount,
        // default ripple
        SetFlag: 8,
      }
      return client
        .autofill(accountSet)
        .then((tx) => client.sign(JSON.stringify(tx), masterSecret))
        .then((signed) =>
          client.request({
            command: 'submit',
            tx_blob: signed.signedTransaction,
          }),
        )
        .then(() => ledgerAccept(client))
    })
    .then(() =>
      makeTrustLine(testcase, wallet.getAddress(), wallet.getSecret()),
    )
    .then(() =>
      makeTrustLine(
        testcase,
        testcase.newWallet.xAddress,
        testcase.newWallet.secret,
      ),
    )
    .then(() => payTo(client, wallet.getAddress(), '123', 'USD', masterAccount))
    .then(() => payTo(client, 'rMwjYedjc7qqtKYVLiAccJSmCwih4LnE2q'))
    .then(() => {
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
      return makeOrder(testcase.client, offerCreate, testcase.newWallet.secret)
    })
    .then(() => {
      const offerCreate: OfferCreate = {
        TransactionType: 'OfferCreate',
        Account: masterAccount,
        TakerPays: xrpToDrops('1741'),
        TakerGets: {
          currency: 'USD',
          value: '171',
          issuer: masterAccount,
        },
      }
      return makeOrder(testcase.client, offerCreate, masterSecret)
    })
  return promise
}

function teardown(this: any) {
  return this.client.disconnect()
}

function suiteSetup(this: any) {
  this.transactions = []

  return (
    setup
      .bind(this)(serverUrl)
      .then(() => ledgerAccept(this.client))
      .then(
        () =>
          (this.newWallet = generateXAddress({ includeClassicAddress: true })),
      )
      // two times to give time to server to send `ledgerClosed` event
      // so getLedgerVersion will return right value
      .then(() => ledgerAccept(this.client))
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
      .then(() => setupAccounts(this))
      .then(() => teardown.bind(this)())
  )
}

describe('integration tests', function () {
  const address = wallet.getAddress()
  this.timeout(TIMEOUT)

  before(suiteSetup)
  beforeEach(_.partial(setup, serverUrl))
  afterEach(teardown)

  it('isConnected', function () {
    assert(this.client.isConnected())
  })

  it('getFee', function () {
    return this.client.getFee().then((fee) => {
      assert.strictEqual(typeof fee, 'string')
      assert(!isNaN(Number(fee)))
      assert(parseFloat(fee) === Number(fee))
    })
  })

  // it('getTrustlines', function () {
  //   const fixture = requests.prepareTrustline.simple
  //   const { currency, counterparty } = fixture
  //   const options = { currency, counterparty }
  //   return this.client.getTrustlines(address, options).then((data) => {
  //     assert(data && data.length > 0 && data[0] && data[0].specification)
  //     const specification = data[0].specification
  //     assert.strictEqual(Number(specification.limit), Number(fixture.limit))
  //     assert.strictEqual(specification.currency, fixture.currency)
  //     assert.strictEqual(specification.counterparty, fixture.counterparty)
  //   })
  // })

  // it('getBalances', function () {
  //   const fixture = requests.prepareTrustline.simple
  //   const { currency, counterparty } = fixture
  //   const options = { currency, counterparty }
  //   return this.client.getBalances(address, options).then((data) => {
  //     assert(data && data.length > 0 && data[0])
  //     assert.strictEqual(data[0].currency, fixture.currency)
  //     assert.strictEqual(data[0].counterparty, fixture.counterparty)
  //   })
  // })

  it('getOrderbook', function () {
    const orderbook = {
      base: {
        currency: 'XRP',
      },
      counter: {
        currency: 'USD',
        counterparty: masterAccount,
      },
    }
    return this.client.getOrderbook(address, orderbook).then((book) => {
      assert(book && book.bids && book.bids.length > 0)
      assert(book.asks && book.asks.length > 0)
      const bid = book.bids[0]
      assert(bid && bid.specification && bid.specification.quantity)
      assert(bid.specification.totalPrice)
      assert.strictEqual(bid.specification.direction, 'buy')
      assert.strictEqual(bid.specification.quantity.currency, 'XRP')
      assert.strictEqual(bid.specification.totalPrice.currency, 'USD')
      const ask = book.asks[0]
      assert(ask && ask.specification && ask.specification.quantity)
      assert(ask.specification.totalPrice)
      assert.strictEqual(ask.specification.direction, 'sell')
      assert.strictEqual(ask.specification.quantity.currency, 'XRP')
      assert.strictEqual(ask.specification.totalPrice.currency, 'USD')
    })
  })

  // it('getPaths', function () {
  //   const pathfind = {
  //     source: {
  //       address: address
  //     },
  //     destination: {
  //       address: this.newWallet.address,
  //       amount: {
  //         value: '1',
  //         currency: 'USD',
  //         counterparty: masterAccount
  //       }
  //     }
  //   }
  //   return this.client.getPaths(pathfind).then((data) => {
  //     assert(data && data.length > 0)
  //     const path = data[0]
  //     assert(path && path.source)
  //     assert.strictEqual(path.source.address, address)
  //     assert(path.paths && path.paths.length > 0)
  //   })
  // })

  // it('getPaths - send all', function () {
  //   const pathfind = {
  //     source: {
  //       address: address,
  //       amount: {
  //         currency: 'USD',
  //         value: '0.005'
  //       }
  //     },
  //     destination: {
  //       address: this.newWallet.address,
  //       amount: {
  //         currency: 'USD'
  //       }
  //     }
  //   }

  //   return this.client.getPaths(pathfind).then((data) => {
  //     assert(data && data.length > 0)
  //     assert(
  //       data.every((path) => {
  //         return (
  //           parseFloat(path.source.amount.value) <=
  //           parseFloat(pathfind.source.amount.value)
  //         )
  //       })
  //     )
  //     const path = data[0]
  //     assert(path && path.source)
  //     assert.strictEqual(path.source.address, pathfind.source.address)
  //     assert(path.paths && path.paths.length > 0)
  //   })
  // })

  it('generateWallet', function () {
    const newWallet = generateXAddress()
    assert(newWallet && newWallet.xAddress && newWallet.secret)
    assert(isValidXAddress(newWallet.xAddress))
    assert(isValidSecret(newWallet.secret))
  })

  const multisignAccount = 'r5nx8ZkwEbFztnc8Qyi22DE9JYjRzNmvs'
  const multisignSecret = 'ss6F8381Br6wwpy9p582H8sBt19J3'
  const signer1address = 'rQDhz2ZNXmhxzCYwxU6qAbdxsHA4HV45Y2'
  const signer1secret = 'shK6YXzwYfnFVn3YZSaMh5zuAddKx'
  const signer2address = 'r3RtUvGw9nMoJ5FuHxuoVJvcENhKtuF9ud'
  const signer2secret = 'shUHQnL4EH27V4EiBrj6EfhWvZngF'

  it('submit multisigned transaction', function () {
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
    let minLedgerVersion = null
    let fundAmount = '20'
    return this.client
      .request({ command: 'server_info' })
      .then(
        (response) =>
          (fundAmount = xrpToDrops(
            Number(response.result.info.validated_ledger.reserve_base_xrp) * 2,
          )),
      )
      .then(() =>
        payTo(this.client, multisignAccount, fundAmount)
          .then(() => {
            return this.client
              .request({
                command: 'ledger',
                ledger_index: 'validated',
              })
              .then((response) => response.result.ledger_index)
              .then((ledgerVersion) => {
                minLedgerVersion = ledgerVersion
              })
              .then(() => this.client.autofill(signerListSet, 2))
              .then((tx) => {
                return testTransaction(
                  this,
                  'SignerListSet',
                  minLedgerVersion,
                  { txJSON: JSON.stringify(tx) },
                  multisignAccount,
                  multisignSecret,
                )
              })
          })
          .then(() => {
            const accountSet: AccountSet = {
              TransactionType: 'AccountSet',
              Account: multisignAccount,
              Domain: convertStringToHex('example.com'),
            }
            return this.client.autofill(accountSet, 2).then((tx) => {
              const signed1 = this.client.sign(
                JSON.stringify(tx),
                signer1secret,
                {
                  signAs: signer1address,
                },
              )
              const signed2 = this.client.sign(
                JSON.stringify(tx),
                signer2secret,
                {
                  signAs: signer2address,
                },
              )
              const combined = this.client.combine([
                signed1.signedTransaction,
                signed2.signedTransaction,
              ])
              return this.client
                .request({
                  command: 'submit',
                  tx_blob: combined.signedTransaction,
                })
                .then((response) =>
                  acceptLedger(this.client).then(() => response),
                )
                .then((response) => {
                  assert.strictEqual(
                    response.result.engine_result,
                    'tesSUCCESS',
                  )
                  const options = { minLedgerVersion }
                  return verifyTransaction(
                    this,
                    combined.id,
                    'AccountSet',
                    options,
                    {},
                    multisignAccount,
                  )
                })
                .catch((error) => {
                  console.log(error.message)
                  throw error
                })
            })
          }),
      )
  })
})
