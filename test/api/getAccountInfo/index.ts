import responses from '../../fixtures/responses'
import { assertRejects, assertResultMatch, TestSuite } from '../../utils'

/**
 * Every test suite exports their tests in the default object.
 * - Check out the "TestSuite" type for documentation on the interface.
 * - Check out "test/api/index.ts" for more information about the test runner.
 */
export default <TestSuite>{
  'getAccountInfo': async (api, address) => {
    const result = await api.getAccountInfo(address)
    assertResultMatch(result, responses.getAccountInfo, 'getAccountInfo')
  },

  'getAccountInfo - options undefined': async (api, address) => {
    const result = await api.getAccountInfo(address, undefined)
    assertResultMatch(result, responses.getAccountInfo, 'getAccountInfo')
  },

  'getAccountInfo - invalid options': async (api, address) => {
    await assertRejects(
      // @ts-ignore - This is intentionally invalid
      api.getAccountInfo(address, { invalid: 'options' }),
      api.errors.ValidationError
    )
  }
}
