import responses from '../../fixtures/responses'
import {assertRejects, assertResultMatch, TestSuite} from '../../utils'
const {getSettings: RESPONSE_FIXTURES} = responses

/**
 * Every test suite exports their tests in the default object.
 * - Check out the "TestSuite" type for documentation on the interface.
 * - Check out "test/client/index.ts" for more information about the test runner.
 */
export default <TestSuite>{
  'getSettings': async (client, address) => {
    const result = await client.getSettings(address)
    assertResultMatch(result, RESPONSE_FIXTURES, 'getSettings')
  },

  'getSettings - options undefined': async (client, address) => {
    const result = await client.getSettings(address, undefined)
    assertResultMatch(result, RESPONSE_FIXTURES, 'getSettings')
  },

  'getSettings - invalid options': async (client, address) => {
    await assertRejects(
      // @ts-ignore - This is intentionally invalid
      client.getSettings(address, {invalid: 'options'}),
      client.errors.ValidationError
    )
  }
}
