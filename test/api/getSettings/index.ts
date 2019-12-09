import responses from '../../fixtures/responses'
import { assertRejects, assertResultMatch, TestSuite } from '../../utils'
const { getSettings: RESPONSE_FIXTURES } = responses

/**
 * Every test suite exports their tests in the default object.
 * - Check out the "TestSuite" type for documentation on the interface.
 * - Check out "test/api/index.ts" for more information about the test runner.
 */
export default <TestSuite>{
  'getSettings': async (api, address) => {
    const result = await api.getSettings(address)
    assertResultMatch(result, RESPONSE_FIXTURES, 'getSettings')
  },

  'getSettings - options undefined': async (api, address) => {
    const result = await api.getSettings(address, undefined)
    assertResultMatch(result, RESPONSE_FIXTURES, 'getSettings')
  },

  'getSettings - invalid options': async (api, address) => {
    await assertRejects(
      // @ts-ignore - This is intentionally invalid
      api.getSettings(address, { invalid: 'options' }),
      api.errors.ValidationError
    )
  }
}
