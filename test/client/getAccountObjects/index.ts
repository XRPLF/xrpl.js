import responses from '../../fixtures/responses'
import {assertResultMatch, TestSuite} from '../../utils'
const {getAccountObjects: RESPONSE_FIXTURES} = responses

/**
 * Every test suite exports their tests in the default object.
 * - Check out the "TestSuite" type for documentation on the interface.
 * - Check out "test/client/index.ts" for more information about the test runner.
 */
export default <TestSuite>{
  'getAccountObjects': async (client, address) => {
    const result = await client.getAccountObjects(address)
    assertResultMatch(result, RESPONSE_FIXTURES, 'AccountObjectsResponse')
  },

  'getAccountObjects - invalid options': async (client, address) => {
    // @ts-ignore - This is intentionally invalid
    const result = await client.getAccountObjects(address, {invalid: 'options'})
    assertResultMatch(result, RESPONSE_FIXTURES, 'AccountObjectsResponse')
  }
}
