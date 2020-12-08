import _ from 'lodash'
import assert from 'assert'
import wallet from './wallet'
import requests from '../fixtures/requests'
import {RippleAPI} from 'ripple-api'
import {isValidClassicAddress} from 'ripple-address-codec'
import {isValidSecret} from 'ripple-api/common/utils'

// how long before each test case times out
const TIMEOUT = 20000

const serverUrl = 'wss://s.altnet.rippletest.net:51233'

function acceptLedger(api) {
  return Promise.resolve()
  // return api.connection.request({command: 'ledger_accept'})
}

async function testTransaction(
  testcase,
  type,
  lastClosedLedgerVersion,
  prepared,
  address = wallet.getAddress(),
  secret = wallet.getSecret()
) {
  address = await address
  secret = await secret
  const txJSON = prepared.txJSON
  assert(txJSON, 'missing txJSON')
  const txData = JSON.parse(txJSON)
  assert.strictEqual(txData.Account, address)
  const signedData = testcase.api.sign(txJSON, secret)
  return testcase.api
    .submit(signedData.signedTransaction)
    .then((data) =>
      testcase.test.title.indexOf('multisign') !== -1
        ? acceptLedger(testcase.api).then(() => data)
        : data
    )
    .then((data) => {
      assert.strictEqual(data.resultCode, 'tesSUCCESS')
      return prepared
    })
}

function setup(this: any, server = 'wss://s1.ripple.com') {
  this.api = new RippleAPI({server})
  return this.api.connect().then(
    () => {},
    (error) => {
      console.log('ERROR:', error)
      throw error
    }
  )
}

function teardown(this: any) {
  return this.api.disconnect()
}

describe('integration tests', async function () {
  const instructions = {maxLedgerVersionOffset: 10}
  this.timeout(TIMEOUT)

  beforeEach(_.partial(setup, serverUrl))
  afterEach(teardown)

  it('settings', async function () {
    const address = await wallet.getAddress()
    return this.api.getLedgerVersion().then((ledgerVersion) => {
      return this.api
        .prepareSettings(address, {
          "domain": "ripple.com",
          "memos": [
            {
              "type": "test",
              "format": "text/plain",
              "data": "texted data"
            }
          ]
        })
        .then((prepared) =>
          testTransaction(this, 'settings', ledgerVersion, prepared)
        )
    })
  })

  it('trustline', async function () {
    const address = await wallet.getAddress()
    const trustline = Object.assign({}, requests.prepareTrustline.simple, {counterparty: await wallet.getCounterparty()})
    return this.api.getLedgerVersion().then((ledgerVersion) => {
      return this.api
        .prepareTrustline(
          address,
          trustline,
        )
        .then((prepared) =>
          testTransaction(this, 'trustline', ledgerVersion, prepared)
        )
    })
  })

  it('payment', async function () {
    const address = await wallet.getAddress()
    const destination = await wallet.getCounterparty()
    const amount = {currency: 'XRP', value: '0.000001'}
    const paymentSpecification = {
      source: {
        address: address,
        maxAmount: amount
      },
      destination: {
        address: destination,
        amount: amount
      }
    }
    return this.api.getLedgerVersion().then((ledgerVersion) => {
      return this.api
        .preparePayment(address, paymentSpecification, instructions)
        .then((prepared) =>
          testTransaction(this, 'payment', ledgerVersion, prepared)
        )
    })
  })

  it('order', async function () {
    const address = await wallet.getAddress()
    const destination = await wallet.getCounterparty()
    const orderSpecification = {
      direction: 'buy',
      quantity: {
        currency: 'USD',
        value: '237',
        counterparty: destination
      },
      totalPrice: {
        currency: 'XRP',
        value: '0.0002'
      }
    }
    return this.api.getLedgerVersion().then((ledgerVersion) => {
      return this.api
        .prepareOrder(address, orderSpecification)
        .then((prepared) =>
          testTransaction(this, 'order', ledgerVersion, prepared)
        )
    })
  })

  it('ticket', async function () {
    const address = await wallet.getAddress()
    return this.api.getLedgerVersion().then((ledgerVersion) => {
      return this.api
        .prepareTicketCreate(address, 1, instructions)
        .then((prepared) =>
          testTransaction(this, 'ticket', ledgerVersion, prepared)
        )
        .catch(e => console.log("Tickets not implemented"))
    })
  })

  it('isConnected', function () {
    assert(this.api.isConnected())
  })

  let completeLedgers = {min: -1, max: -1}
  it('getServerInfo', function () {
    return this.api.getServerInfo().then((data) => {
      completeLedgers.min = parseInt(data.completeLedgers.split("-")[0])
      completeLedgers.max = parseInt(data.completeLedgers.split("-")[1])
      assert(data && data.pubkeyNode)
    })
  })

  it('getFee', function () {
    return this.api.getFee().then((fee) => {
      assert.strictEqual(typeof fee, 'string')
      assert(!isNaN(Number(fee)))
      assert(parseFloat(fee) === Number(fee))
    })
  })

  it('getLedgerVersion', function () {
    return this.api.getLedgerVersion().then((ledgerVersion) => {
      assert.strictEqual(typeof ledgerVersion, 'number')
      assert(ledgerVersion >= 0)
    })
  })

  it('getTransactions', async function () {
    const address = await wallet.getAddress()
    const options = {
      minLedgerVersion: completeLedgers.min,
      maxLedgerVersion: completeLedgers.max
    }
    return this.api.getTransactions(address, options)
      .then((transactionsData) => {
        assert(transactionsData)
        assert(transactionsData.length > 0)
      })
  })

  it('getTrustlines', async function () {
    const address = await wallet.getAddress()
    const counterparty = await wallet.getCounterparty()
    const fixture = requests.prepareTrustline.simple
    const options = {
      currency: fixture.currency,
      counterparty: counterparty
    }
    return this.api.getTrustlines(address, options).then((data) => {
      assert(data && data.length > 0 && data[0] && data[0].specification)
      const specification = data[0].specification
      assert.strictEqual(Number(specification.limit), Number(fixture.limit))
      assert.strictEqual(specification.currency, fixture.currency)
      assert.strictEqual(specification.counterparty, counterparty)
    })
  })

  it('getBalances', async function () {
    const address = await wallet.getAddress()
    const counterparty = await wallet.getCounterparty()
    const options = {
      currency: 'BTC',
      counterparty: counterparty
    }
    return this.api.getBalances(address, options).then((data) => {
      assert(data && data.length > 0 && data[0])
      assert.strictEqual(data[0].currency, 'BTC')
      assert.strictEqual(data[0].counterparty, counterparty)
    })
  })

  it('getOrderbook', async function () {
    const address = await wallet.getAddress()
    const counterparty = await wallet.getCounterparty()

    const orderbook = {
      base: {
        currency: 'XRP'
      },
      counter: {
        currency: 'USD',
        counterparty: counterparty
      }
    }
    return this.api.getOrderbook(address, orderbook).then((book) => {
      assert(book.asks && book.asks.length > 0)
      const ask = book.asks[0]
      assert(ask && ask.specification && ask.specification.quantity)
      assert(ask.specification.totalPrice)
      assert.strictEqual(ask.specification.direction, 'sell')
      assert.strictEqual(ask.specification.quantity.currency, 'XRP')
      assert.strictEqual(ask.specification.totalPrice.currency, 'USD')
    })
  })

  it('generateWallet', function () {
    const newWallet = this.api.generateAddress()
    assert(newWallet && newWallet.address && newWallet.secret)
    assert(isValidClassicAddress(newWallet.address))
    assert(isValidSecret(newWallet.secret))
  })
  this.timeout(TIMEOUT)
})
