import assert from 'assert-diff'
import responses from '../../fixtures/responses'
import { TestSuite } from '../../utils'

/**
 * Every test suite exports their tests in the default object.
 * - Check out the "TestSuite" type for documentation on the interface.
 * - Check out "test/api/index.ts" for more information about the test runner.
 */
export default <TestSuite>{
  'generateXAddress': async (api, address) => {
    function random() {
      return new Array(16).fill(0)
    }
    assert.deepEqual(
      api.generateXAddress({ entropy: random() }),
      responses.generateXAddress
    )
  },

  'generateXAddress invalid': async (api, address) => {
    assert.throws(() => {
      function random() {
        return new Array(1).fill(0)
      }
      api.generateXAddress({ entropy: random() })
    }, api.errors.UnexpectedError)
  }
}
