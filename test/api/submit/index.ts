import responses from '../../fixtures/responses'
import {assertRejects, assertResultMatch, TestSuite} from '../../utils'

/**
 * Every test suite exports their tests in the default object.
 * - Check out the "TestSuite" type for documentation on the interface.
 * - Check out "test/api/index.ts" for more information about the test runner.
 */
export default <TestSuite>{
  'submit': async (api, address) => {
    const result = await api.submit(responses.sign.normal.signedTransaction)
    assertResultMatch(result, responses.submit, 'submit')
  },

  'submit - failure': async (api, address) => {
    await assertRejects(api.submit('BAD'), api.errors.RippledError)
    // assert.strictEqual(error.data.resultCode, 'temBAD_FEE')
  }
}
