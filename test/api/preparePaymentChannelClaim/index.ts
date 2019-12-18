import assert from 'assert-diff'
import requests from '../../fixtures/requests'
import responses from '../../fixtures/responses'
import {assertResultMatch, TestSuite} from '../../utils'
const instructionsWithMaxLedgerVersionOffset = {maxLedgerVersionOffset: 100}
const {preparePaymentChannelClaim: REQUEST_FIXTURES} = requests
const {preparePaymentChannelClaim: RESPONSE_FIXTURES} = responses

/**
 * Every test suite exports their tests in the default object.
 * - Check out the "TestSuite" type for documentation on the interface.
 * - Check out "test/api/index.ts" for more information about the test runner.
 */
export default <TestSuite>{
  'default': async (api, address) => {
    const localInstructions = {
      ...instructionsWithMaxLedgerVersionOffset,
      maxFee: '0.000012'
    }
    const response = await api.preparePaymentChannelClaim(
      address,
      REQUEST_FIXTURES.normal,
      localInstructions
    )
    assertResultMatch(response, RESPONSE_FIXTURES.normal, 'prepare')
  },

  'with renew': async (api, address) => {
    const localInstructions = {
      ...instructionsWithMaxLedgerVersionOffset,
      maxFee: '0.000012'
    }
    const response = await api.preparePaymentChannelClaim(
      address,
      REQUEST_FIXTURES.renew,
      localInstructions
    )
    assertResultMatch(response, RESPONSE_FIXTURES.renew, 'prepare')
  },

  'with close': async (api, address) => {
    const localInstructions = {
      ...instructionsWithMaxLedgerVersionOffset,
      maxFee: '0.000012'
    }
    const response = await api.preparePaymentChannelClaim(
      address,
      REQUEST_FIXTURES.close,
      localInstructions
    )
    assertResultMatch(response, RESPONSE_FIXTURES.close, 'prepare')
  },

  'rejects Promise on preparePaymentChannelClaim with renew and close': async (
    api,
    address
  ) => {
    try {
      const prepared = await api.preparePaymentChannelClaim(
        address,
        REQUEST_FIXTURES.full
      )
      throw new Error(
        'Expected method to reject. Prepared transaction: ' +
          JSON.stringify(prepared)
      )
    } catch (err) {
      assert.strictEqual(err.name, 'ValidationError')
      assert.strictEqual(
        err.message,
        '"renew" and "close" flags on PaymentChannelClaim are mutually exclusive'
      )
    }
  },

  'rejects Promise on preparePaymentChannelClaim with no signature': async (
    api,
    address
  ) => {
    try {
      const prepared = await api.preparePaymentChannelClaim(
        address,
        REQUEST_FIXTURES.noSignature
      )
      throw new Error(
        'Expected method to reject. Prepared transaction: ' +
          JSON.stringify(prepared)
      )
    } catch (err) {
      assert.strictEqual(err.name, 'ValidationError')
      assert.strictEqual(
        err.message,
        '"signature" and "publicKey" fields on PaymentChannelClaim must only be specified together.'
      )
    }
  }
}
