import _ from 'lodash'
import assert from 'assert'
import wallet from './wallet'
import requests from '../fixtures/requests'
import {Client} from 'xrpl-local'
import {isValidClassicAddress} from 'ripple-address-codec'
import {payTo, ledgerAccept} from './utils'
import {errors} from 'xrpl-local/common'
import {isValidSecret} from 'xrpl-local/common/utils'

// how long before each test case times out
const TIMEOUT = 20000
const INTERVAL = 1000 // how long to wait between checks for validated ledger

const HOST = process.env.HOST ?? "0.0.0.0"
const PORT = process.env.PORT ?? "6006"
const serverUrl = `ws://${HOST}:${PORT}`

console.log(serverUrl)

function acceptLedger(client) {
  return client.connection.request({command: 'ledger_accept'})
}

function verifyTransaction(testcase, hash, type, options, txData, address) {
  console.log('VERIFY...')
  return testcase.client
    .getTransaction(hash, options)
    .then((data) => {
      assert(data && data.outcome)
      assert.strictEqual(data.type, type)
      assert.strictEqual(data.address, address)
      assert.strictEqual(data.outcome.result, 'tesSUCCESS')
      if (testcase.transactions != null) {
        testcase.transactions.push(hash)
      }
      return {txJSON: JSON.stringify(txData), id: hash, tx: data}
    })
    .catch((error) => {
      if (error instanceof errors.PendingLedgerVersionError) {
        console.log('NOT VALIDATED YET...')
        return new Promise((resolve, reject) => {
          setTimeout(
            () =>
              verifyTransaction(
                testcase,
                hash,
                type,
                options,
                txData,
                address
              ).then(resolve, reject),
            INTERVAL
          )
        })
      }
      console.log(error.stack)
      assert(false, 'Transaction not successful: ' + error.message)
    })
}

function testTransaction(
  testcase,
  type,
  lastClosedLedgerVersion,
  prepared,
  address = wallet.getAddress(),
  secret = wallet.getSecret()
) {
  const txJSON = prepared.txJSON
  assert(txJSON, 'missing txJSON')
  const txData = JSON.parse(txJSON)
  assert.strictEqual(txData.Account, address)
  const signedData = testcase.client.sign(txJSON, secret)
  console.log('PREPARED...')
  return testcase.client
    .submit(signedData.signedTransaction)
    .then((data) =>
      testcase.test.title.indexOf('multisign') !== -1
        ? acceptLedger(testcase.client).then(() => data)
        : data
    )
    .then((data) => {
      console.log('SUBMITTED...')
      assert.strictEqual(data.resultCode, 'tesSUCCESS')
      const options = {
        minLedgerVersion: lastClosedLedgerVersion,
        maxLedgerVersion: txData.LastLedgerSequence
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
              address
            ).then(resolve, reject),
          INTERVAL
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
    }
  )
}

const masterAccount = 'rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh'
const masterSecret = 'snoPBrXtMeMyMHUVTgbuqAfg1SUTb'

function makeTrustLine(testcase, address, secret) {
  const client = testcase.client
  const specification = {
    currency: 'USD',
    counterparty: masterAccount,
    limit: '1341.1',
    ripplingDisabled: true
  }
  const trust = client
    .prepareTrustline(address, specification, {})
    .then((data) => {
      const signed = client.sign(data.txJSON, secret)
      if (address === wallet.getAddress()) {
        testcase.transactions.push(signed.id)
      }
      return client.submit(signed.signedTransaction)
    })
    .then(() => ledgerAccept(client))
  return trust
}

function makeOrder(client, address, specification, secret) {
  return client
    .prepareOrder(address, specification)
    .then((data) => client.sign(data.txJSON, secret))
    .then((signed) => client.submit(signed.signedTransaction))
    .then(() => ledgerAccept(client))
}

function setupAccounts(testcase) {
  const client = testcase.client

  const promise = payTo(client, 'rMH4UxPrbuMa1spCBR98hLLyNJp4d8p4tM')
    .then(() => payTo(client, wallet.getAddress()))
    .then(() => payTo(client, testcase.newWallet.address))
    .then(() => payTo(client, 'rKmBGxocj9Abgy25J51Mk1iqFzW9aVF9Tc'))
    .then(() => payTo(client, 'rMwjYedjc7qqtKYVLiAccJSmCwih4LnE2q'))
    .then(() => {
      return client
        .prepareSettings(masterAccount, {defaultRipple: true})
        .then((data) => client.sign(data.txJSON, masterSecret))
        .then((signed) => client.submit(signed.signedTransaction))
        .then(() => ledgerAccept(client))
    })
    .then(() =>
      makeTrustLine(testcase, wallet.getAddress(), wallet.getSecret())
    )
    .then(() =>
      makeTrustLine(
        testcase,
        testcase.newWallet.address,
        testcase.newWallet.secret
      )
    )
    .then(() => payTo(client, wallet.getAddress(), '123', 'USD', masterAccount))
    .then(() => payTo(client, 'rMwjYedjc7qqtKYVLiAccJSmCwih4LnE2q'))
    .then(() => {
      const orderSpecification = {
        direction: 'buy',
        quantity: {
          currency: 'USD',
          value: '432',
          counterparty: masterAccount
        },
        totalPrice: {
          currency: 'XRP',
          value: '432'
        }
      }
      return makeOrder(
        testcase.client,
        testcase.newWallet.address,
        orderSpecification,
        testcase.newWallet.secret
      )
    })
    .then(() => {
      const orderSpecification = {
        direction: 'buy',
        quantity: {
          currency: 'XRP',
          value: '1741'
        },
        totalPrice: {
          currency: 'USD',
          value: '171',
          counterparty: masterAccount
        }
      }
      return makeOrder(
        testcase.client,
        masterAccount,
        orderSpecification,
        masterSecret
      )
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
      .then(() => (this.newWallet = this.client.generateAddress()))
      // two times to give time to server to send `ledgerClosed` event
      // so getLedgerVersion will return right value
      .then(() => ledgerAccept(this.client))
      .then(() => this.client.getLedgerVersion())
      .then((ledgerVersion) => {
        this.startLedgerVersion = ledgerVersion
      })
      .then(() => setupAccounts(this))
      .then(() => teardown.bind(this)())
  )
}

describe('integration tests', function () {
  const address = wallet.getAddress()
  const instructions = {maxLedgerVersionOffset: 10}
  this.timeout(TIMEOUT)

  before(suiteSetup)
  beforeEach(_.partial(setup, serverUrl))
  afterEach(teardown)

  it('settings', function () {
    return this.client.getLedgerVersion().then((ledgerVersion) => {
      return this.client
        .prepareSettings(address, requests.prepareSettings.domain, instructions)
        .then((prepared) =>
          testTransaction(this, 'settings', ledgerVersion, prepared)
        )
    })
  })

  it('trustline', function () {
    return this.client.getLedgerVersion().then((ledgerVersion) => {
      return this.client
        .prepareTrustline(
          address,
          requests.prepareTrustline.simple,
          instructions
        )
        .then((prepared) =>
          testTransaction(this, 'trustline', ledgerVersion, prepared)
        )
    })
  })

  it('payment', function () {
    const amount = {currency: 'XRP', value: '0.000001'}
    const paymentSpecification = {
      source: {
        address: address,
        maxAmount: amount
      },
      destination: {
        address: 'rKmBGxocj9Abgy25J51Mk1iqFzW9aVF9Tc',
        amount: amount
      }
    }
    return this.client.getLedgerVersion().then((ledgerVersion) => {
      return this.client
        .preparePayment(address, paymentSpecification, instructions)
        .then((prepared) =>
          testTransaction(this, 'payment', ledgerVersion, prepared)
        )
    })
  })

  it('order', function () {
    const orderSpecification = {
      direction: 'buy',
      quantity: {
        currency: 'USD',
        value: '237',
        counterparty: 'rMwjYedjc7qqtKYVLiAccJSmCwih4LnE2q'
      },
      totalPrice: {
        currency: 'XRP',
        value: '0.0002'
      }
    }
    return this.client.getLedgerVersion().then((ledgerVersion) => {
      return this.client
        .prepareOrder(address, orderSpecification, instructions)
        .then((prepared) =>
          testTransaction(this, 'order', ledgerVersion, prepared)
        )
        .then((result) => {
          const txData = JSON.parse(result.txJSON)
          return this.client.getOrders(address).then((orders) => {
            assert(orders && orders.length > 0)
            const createdOrder = (
              orders.filter((order) => {
                return order.properties.sequence === txData.Sequence
              })
            )[0]
            assert(createdOrder)
            assert.strictEqual(createdOrder.properties.maker, address)
            assert.deepEqual(createdOrder.specification, orderSpecification)
            return txData
          })
        })
        .then((txData) =>
          this.client
            .prepareOrderCancellation(
              address,
              {orderSequence: txData.Sequence},
              instructions
            )
            .then((prepared) =>
              testTransaction(
                this,
                'orderCancellation',
                ledgerVersion,
                prepared
              )
            )
        )
    })
  })

  it('isConnected', function () {
    assert(this.client.isConnected())
  })

  it('getServerInfo', function () {
    return this.client.getServerInfo().then((data) => {
      assert(data && data.result.info.pubkey_node)
    })
  })

  it('getFee', function () {
    return this.client.getFee().then((fee) => {
      assert.strictEqual(typeof fee, 'string')
      assert(!isNaN(Number(fee)))
      assert(parseFloat(fee) === Number(fee))
    })
  })

  it('getLedgerVersion', function () {
    return this.client.getLedgerVersion().then((ledgerVersion) => {
      assert.strictEqual(typeof ledgerVersion, 'number')
      assert(ledgerVersion >= this.startLedgerVersion)
    })
  })

  it('getTransactions', function () {
    const options = {
      initiated: true,
      minLedgerVersion: this.startLedgerVersion
    }
    return this.client
      .getTransactions(address, options)
      .then((transactionsData) => {
        assert(transactionsData)
        assert.strictEqual(transactionsData.length, this.transactions.length)
      })
  })

  it('getTrustlines', function () {
    const fixture = requests.prepareTrustline.simple
    const { currency, counterparty } = fixture
    const options = { currency, counterparty }
    return this.client.getTrustlines(address, options).then((data) => {
      assert(data && data.length > 0 && data[0] && data[0].specification)
      const specification = data[0].specification
      assert.strictEqual(Number(specification.limit), Number(fixture.limit))
      assert.strictEqual(specification.currency, fixture.currency)
      assert.strictEqual(specification.counterparty, fixture.counterparty)
    })
  })

  it('getBalances', function () {
    const fixture = requests.prepareTrustline.simple
    const { currency, counterparty } = fixture
    const options = { currency, counterparty }
    return this.client.getBalances(address, options).then((data) => {
      assert(data && data.length > 0 && data[0])
      assert.strictEqual(data[0].currency, fixture.currency)
      assert.strictEqual(data[0].counterparty, fixture.counterparty)
    })
  })

  it('getSettings', function () {
    return this.client.getSettings(address).then((data) => {
      assert(data)
      assert.strictEqual(data.domain, requests.prepareSettings.domain.domain)
    })
  })

  it('getOrderbook', function () {
    const orderbook = {
      base: {
        currency: 'XRP'
      },
      counter: {
        currency: 'USD',
        counterparty: masterAccount
      }
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
    const newWallet = this.client.generateAddress()
    assert(newWallet && newWallet.address && newWallet.secret)
    assert(isValidClassicAddress(newWallet.address))
    assert(isValidSecret(newWallet.secret))
  })
})

describe('integration tests - standalone rippled', function () {
  const instructions = {maxLedgerVersionOffset: 10}
  this.timeout(TIMEOUT)

  beforeEach(_.partial(setup, serverUrl))
  afterEach(teardown)
  const address = 'r5nx8ZkwEbFztnc8Qyi22DE9JYjRzNmvs'
  const secret = 'ss6F8381Br6wwpy9p582H8sBt19J3'
  const signer1address = 'rQDhz2ZNXmhxzCYwxU6qAbdxsHA4HV45Y2'
  const signer1secret = 'shK6YXzwYfnFVn3YZSaMh5zuAddKx'
  const signer2address = 'r3RtUvGw9nMoJ5FuHxuoVJvcENhKtuF9ud'
  const signer2secret = 'shUHQnL4EH27V4EiBrj6EfhWvZngF'

  it('submit multisigned transaction', function () {
    const signers = {
      threshold: 2,
      weights: [
        {address: signer1address, weight: 1},
        {address: signer2address, weight: 1}
      ]
    }
    let minLedgerVersion = null
    return payTo(this.client, address)
      .then(() => {
        return this.client.getLedgerVersion().then((ledgerVersion) => {
          minLedgerVersion = ledgerVersion
          return this.client
            .prepareSettings(address, {signers}, instructions)
            .then((prepared) => {
              return testTransaction(
                this,
                'settings',
                ledgerVersion,
                prepared,
                address,
                secret
              )
            })
        })
      })
      .then(() => {
        const multisignInstructions = Object.assign({}, instructions, {
          signersCount: 2
        })
        return this.client
          .prepareSettings(
            address,
            {domain: 'example.com'},
            multisignInstructions
          )
          .then((prepared) => {
            const signed1 = this.client.sign(prepared.txJSON, signer1secret, {
              signAs: signer1address
            })
            const signed2 = this.client.sign(prepared.txJSON, signer2secret, {
              signAs: signer2address
            })
            const combined = this.client.combine([
              signed1.signedTransaction,
              signed2.signedTransaction
            ])
            return this.client
              .submit(combined.signedTransaction)
              .then((response) => acceptLedger(this.client).then(() => response))
              .then((response) => {
                assert.strictEqual(response.resultCode, 'tesSUCCESS')
                const options = {minLedgerVersion}
                return verifyTransaction(
                  this,
                  combined.id,
                  'settings',
                  options,
                  {},
                  address
                )
              })
              .catch((error) => {
                console.log(error.message)
                throw error
              })
          })
      })
  })
})
