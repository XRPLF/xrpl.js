import assert from 'assert-diff'
import _ from 'lodash'
import {Client} from 'xrpl-local'
import {RecursiveData} from 'xrpl-local/ledger/utils'
import {assertRejects, assertResultMatch} from './utils'
// import addresses from './fixtures/addresses.json'
import responses from './fixtures/responses'
import ledgerClosed from './fixtures/rippled/ledger-close-newer.json'
import setupClient from './setup-client'
// import * as schemaValidator from '../src/common/schema-validator'
// import {validate} from '../src/common'
import * as ledgerUtils from '../src/ledger/utils'

// const address = addresses.ACCOUNT
assert.options.strict = true

// how long before each test case times out
const TIMEOUT = 20000

describe('Client', function () {
  this.timeout(TIMEOUT)
  beforeEach(setupClient.setup)
  afterEach(setupClient.teardown)

  it('Client - implicit server port', function () {
    new Client({server: 'wss://s1.ripple.com'})
  })

  it('Client invalid options', function () {
    // @ts-ignore - This is intentionally invalid
    assert.throws(() => new Client({invalid: true}))
  })

  it('Client valid options', function () {
    const client = new Client({server: 'wss://s:1'})
    const privateConnectionUrl = (client.connection as any)._url
    assert.deepEqual(privateConnectionUrl, 'wss://s:1')
  })

  it('Client invalid server uri', function () {
    assert.throws(() => new Client({server: 'wss//s:1'}))
  })

  xit('Client connect() times out after 2 seconds', function () {
    // TODO: Use a timer mock like https://jestjs.io/docs/en/timer-mocks
    //       to test that connect() times out after 2 seconds.
  })

  it('ledger closed event', function (done) {
    this.client.on('ledger', (message) => {
      assertResultMatch(message, responses.ledgerEvent, 'ledgerEvent')
      done()
    })
    this.client.connection._ws.emit('message', JSON.stringify(ledgerClosed))
  })

  it('common utils - toRippledAmount', async () => {
    const amount = {issuer: 'is', currency: 'c', value: 'v'}
    assert.deepEqual(ledgerUtils.common.toRippledAmount(amount), {
      issuer: 'is',
      currency: 'c',
      value: 'v'
    })
  })

  it('ledger utils - renameCounterpartyToIssuerInOrder', async () => {
    const order = {
      taker_gets: {counterparty: '1', currency: 'XRP'},
      taker_pays: {counterparty: '1', currency: 'XRP'}
    }
    const expected = {
      taker_gets: {issuer: '1', currency: 'XRP'},
      taker_pays: {issuer: '1', currency: 'XRP'}
    }
    assert.deepEqual(
      ledgerUtils.renameCounterpartyToIssuerInOrder(order),
      expected
    )
  })

  it('ledger utils - compareTransactions', async () => {
    // @ts-ignore
    assert.strictEqual(ledgerUtils.compareTransactions({}, {}), 0)
    let first: any = {outcome: {ledgerVersion: 1, indexInLedger: 100}}
    let second: any = {outcome: {ledgerVersion: 1, indexInLedger: 200}}
    assert.strictEqual(ledgerUtils.compareTransactions(first, second), -1)
    first = {outcome: {ledgerVersion: 1, indexInLedger: 100}}
    second = {outcome: {ledgerVersion: 1, indexInLedger: 100}}
    assert.strictEqual(ledgerUtils.compareTransactions(first, second), 0)
    first = {outcome: {ledgerVersion: 1, indexInLedger: 200}}
    second = {outcome: {ledgerVersion: 1, indexInLedger: 100}}
    assert.strictEqual(ledgerUtils.compareTransactions(first, second), 1)
  })

  it('ledger utils - getRecursive', async () => {
    function getter(marker) {
      return new Promise<RecursiveData>((resolve, reject) => {
        if (marker != null) {
          reject(new Error())
          return
        }
        resolve({marker: 'A', results: [1]})
      })
    }
    await assertRejects(ledgerUtils.getRecursive(getter, 10), Error)
  })
})
