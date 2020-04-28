import addresses from '../../fixtures/addresses.json'
import responses from '../../fixtures/responses'
import {assertResultMatch, TestSuite} from '../../utils'
const {getTrustlines: RESPONSE_FIXTURES} = responses

/**
 * Every test suite exports their tests in the default object.
 * - Check out the "TestSuite" type for documentation on the interface.
 * - Check out "test/api/index.ts" for more information about the test runner.
 */
export default <TestSuite>{
  'getTrustlines - filtered': async (api, address) => {
    const options = {currency: 'USD'}
    const result = await api.getTrustlines(address, options)
    assertResultMatch(result, RESPONSE_FIXTURES.filtered, 'getTrustlines')
  },

  'getTrustlines - more than 400 items': async (api, address) => {
    const options = {limit: 401}
    const result = await api.getTrustlines(addresses.THIRD_ACCOUNT, options)
    assertResultMatch(
      result,
      RESPONSE_FIXTURES.moreThan400Items,
      'getTrustlines'
    )
  },

  'getTrustlines - no options': async (api, address) => {
    await api.getTrustlines(address)
  }
}
