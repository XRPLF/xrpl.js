import requests from '../../fixtures/requests'
import responses from '../../fixtures/responses'
import {assertResultMatch, TestSuite} from '../../utils'
const instructionsWithMaxLedgerVersionOffset = {maxLedgerVersionOffset: 100}

/**
 * Every test suite exports their tests in the default object.
 * - Check out the "TestSuite" type for documentation on the interface.
 * - Check out "test/api/index.ts" for more information about the test runner.
 */
export default <TestSuite>{
  'preparePaymentChannelFund': async (api, address) => {
    const localInstructions = {
      ...instructionsWithMaxLedgerVersionOffset,
      maxFee: '0.000012'
    }
    const result = await api.preparePaymentChannelFund(
      address,
      requests.preparePaymentChannelFund.normal,
      localInstructions
    )
    assertResultMatch(
      result,
      responses.preparePaymentChannelFund.normal,
      'prepare'
    )
  },

  'preparePaymentChannelFund full': async (api, address) => {
    const result = await api.preparePaymentChannelFund(
      address,
      requests.preparePaymentChannelFund.full
    )
    assertResultMatch(
      result,
      responses.preparePaymentChannelFund.full,
      'prepare'
    )
  }
}
