import assert from 'assert-diff'
import _ from 'lodash'
import { RippleAPI } from 'ripple-api'
import { RecursiveData } from 'ripple-api/ledger/utils'
import { assertRejects, assertResultMatch } from './utils'
import addresses from './fixtures/addresses.json'
import responses from './fixtures/responses'
import ledgerClosed from './fixtures/rippled/ledger-close-newer.json'
import setupAPI from './setup-api'

const { validate, schemaValidator, ledgerUtils } = RippleAPI._PRIVATE
const address = addresses.ACCOUNT
assert.options.strict = true

// how long before each test case times out
const TIMEOUT = 20000

describe('RippleAPI', function() {
  this.timeout(TIMEOUT)
  beforeEach(setupAPI.setup)
  afterEach(setupAPI.teardown)

  it('RippleAPI - implicit server port', function() {
    new RippleAPI({ server: 'wss://s1.ripple.com' })
  })

  it('RippleAPI invalid options', function() {
    // @ts-ignore - This is intentionally invalid
    assert.throws(() => new RippleAPI({ invalid: true }))
  })

  it('RippleAPI valid options', function() {
    const api = new RippleAPI({ server: 'wss://s:1' })
    const privateConnectionUrl = (api.connection as any)._url
    assert.deepEqual(privateConnectionUrl, 'wss://s:1')
  })

  it('RippleAPI invalid server uri', function() {
    assert.throws(() => new RippleAPI({ server: 'wss//s:1' }))
  })

  xit('RippleAPI connect() times out after 2 seconds', function() {
    // TODO: Use a timer mock like https://jestjs.io/docs/en/timer-mocks
    //       to test that connect() times out after 2 seconds.
  })

  it('ledger closed event', function(done) {
    this.api.on('ledger', message => {
      assertResultMatch(message, responses.ledgerEvent, 'ledgerEvent')
      done()
    })
    this.api.connection._ws.emit('message', JSON.stringify(ledgerClosed))
  })

  describe('[private] schema-validator', function() {
    it('valid', function() {
      assert.doesNotThrow(function() {
        schemaValidator.schemaValidate(
          'hash256',
          '0F7ED9F40742D8A513AE86029462B7A6768325583DF8EE21B7EC663019DD6A0F'
        )
      })
    })

    it('invalid', function() {
      assert.throws(function() {
        schemaValidator.schemaValidate('hash256', 'invalid')
      }, this.api.errors.ValidationError)
    })

    it('invalid - empty value', function() {
      assert.throws(function() {
        schemaValidator.schemaValidate('hash256', '')
      }, this.api.errors.ValidationError)
    })

    it('schema not found error', function() {
      assert.throws(function() {
        schemaValidator.schemaValidate('unexisting', 'anything')
      }, /no schema/)
    })
  })

  describe('[private] validator', function() {
    it('validateLedgerRange', function() {
      const options = {
        minLedgerVersion: 20000,
        maxLedgerVersion: 10000
      }
      const thunk = _.partial(validate.getTransactions, { address, options })
      assert.throws(thunk, this.api.errors.ValidationError)
      assert.throws(
        thunk,
        /minLedgerVersion must not be greater than maxLedgerVersion/
      )
    })

    it('secret', function() {
      function validateSecret(secret) {
        validate.sign({ txJSON: '', secret })
      }
      assert.doesNotThrow(
        _.partial(validateSecret, 'shzjfakiK79YQdMjy4h8cGGfQSV6u')
      )
      assert.throws(
        _.partial(validateSecret, 'shzjfakiK79YQdMjy4h8cGGfQSV6v'),
        this.api.errors.ValidationError
      )
      assert.throws(
        _.partial(validateSecret, 1),
        this.api.errors.ValidationError
      )
      assert.throws(
        _.partial(validateSecret, ''),
        this.api.errors.ValidationError
      )
      assert.throws(
        _.partial(validateSecret, 's!!!'),
        this.api.errors.ValidationError
      )
      assert.throws(
        _.partial(validateSecret, 'passphrase'),
        this.api.errors.ValidationError
      )
      // 32 0s is a valid hex repr of seed bytes
      const hex = new Array(33).join('0')
      assert.throws(
        _.partial(validateSecret, hex),
        this.api.errors.ValidationError
      )
    })
  })

  it('common utils - toRippledAmount', async () => {
    const amount = { issuer: 'is', currency: 'c', value: 'v' }
    assert.deepEqual(ledgerUtils.common.toRippledAmount(amount), {
      issuer: 'is',
      currency: 'c',
      value: 'v'
    })
  })

  it('ledger utils - renameCounterpartyToIssuerInOrder', async () => {
    const order = {
      taker_gets: { counterparty: '1', currency: 'XRP' },
      taker_pays: { counterparty: '1', currency: 'XRP' }
    }
    const expected = {
      taker_gets: { issuer: '1', currency: 'XRP' },
      taker_pays: { issuer: '1', currency: 'XRP' }
    }
    assert.deepEqual(
      ledgerUtils.renameCounterpartyToIssuerInOrder(order),
      expected
    )
  })

  it('ledger utils - compareTransactions', async () => {
    // @ts-ignore
    assert.strictEqual(ledgerUtils.compareTransactions({}, {}), 0)
    let first: any = { outcome: { ledgerVersion: 1, indexInLedger: 100 } }
    let second: any = { outcome: { ledgerVersion: 1, indexInLedger: 200 } }
    assert.strictEqual(ledgerUtils.compareTransactions(first, second), -1)
    first = { outcome: { ledgerVersion: 1, indexInLedger: 100 } }
    second = { outcome: { ledgerVersion: 1, indexInLedger: 100 } }
    assert.strictEqual(ledgerUtils.compareTransactions(first, second), 0)
    first = { outcome: { ledgerVersion: 1, indexInLedger: 200 } }
    second = { outcome: { ledgerVersion: 1, indexInLedger: 100 } }
    assert.strictEqual(ledgerUtils.compareTransactions(first, second), 1)
  })

  it('ledger utils - getRecursive', async () => {
    function getter(marker) {
      return new Promise<RecursiveData>((resolve, reject) => {
        if (marker !== undefined) {
          reject(new Error())
          return
        }
        resolve({ marker: 'A', results: [1] })
      })
    }
    await assertRejects(ledgerUtils.getRecursive(getter, 10), Error)
  })
})
