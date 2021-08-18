import responses from '../../fixtures/responses'
import {assertRejects, assertResultMatch, TestSuite} from '../../utils'

export const config = {
  // TODO: The mock server right now returns a hard-coded string, no matter
  // what "Account" value you pass. We'll need it to support more accurate
  // responses before we can turn these tests on.
  skipXAddress: true
}

/**
 * Every test suite exports their tests in the default object.
 * - Check out the "TestSuite" type for documentation on the interface.
 * - Check out "test/client/index.ts" for more information about the test runner.
 */
export default <TestSuite>{
  'getOrders': async (client, address) => {
    const result = await client.getOrders(address)
    assertResultMatch(result, responses.getOrders, 'getOrders')
  },

  'getOrders - limit': async (client, address) => {
    const result = await client.getOrders(address, {limit: 20})
    assertResultMatch(result, responses.getOrders, 'getOrders')
  },

  'getOrders - invalid options': async (client, address) => {
    await assertRejects(
      // @ts-ignore - This is intentionally invalid
      client.getOrders(address, {invalid: 'options'}),
      client.errors.ValidationError
    )
  }
}
