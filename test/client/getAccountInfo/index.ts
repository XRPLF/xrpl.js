import responses from '../../fixtures/responses'
import {assertRejects, assertResultMatch, TestSuite} from '../../utils'

/**
 * Every test suite exports their tests in the default object.
 * - Check out the "TestSuite" type for documentation on the interface.
 * - Check out "test/client/index.ts" for more information about the test runner.
 */
export default <TestSuite>{
  'getAccountInfo': async (client, address) => {
    const result = await client.getAccountInfo(address)
    assertResultMatch(result, responses.getAccountInfo, 'getAccountInfo')
  },

  'getAccountInfo - options undefined': async (client, address) => {
    const result = await client.getAccountInfo(address, undefined)
    assertResultMatch(result, responses.getAccountInfo, 'getAccountInfo')
  },

  'getAccountInfo - invalid options': async (client, address) => {
    await assertRejects(
      // @ts-ignore - This is intentionally invalid
      client.getAccountInfo(address, {invalid: 'options'}),
      client.errors.ValidationError
    )
  }
}
