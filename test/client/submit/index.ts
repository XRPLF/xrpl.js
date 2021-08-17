import responses from '../../fixtures/responses'
import {assertRejects, assertResultMatch, TestSuite} from '../../utils'

/**
 * Every test suite exports their tests in the default object.
 * - Check out the "TestSuite" type for documentation on the interface.
 * - Check out "test/client/index.ts" for more information about the test runner.
 */
export default <TestSuite>{
  'submit': async (client, address) => {
    const result = await client.submit(responses.sign.normal.signedTransaction)
    assertResultMatch(result, responses.submit, 'submit')
  },

  'submit - failure': async (client, address) => {
    await assertRejects(client.submit('BAD'), client.errors.RippledError)
    // assert.strictEqual(error.data.resultCode, 'temBAD_FEE')
  }
}
