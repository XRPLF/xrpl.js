import assert from 'assert-diff'
import {TestSuite} from '../../utils'

/**
 * Every test suite exports their tests in the default object.
 * - Check out the "TestSuite" type for documentation on the interface.
 * - Check out "test/api/index.ts" for more information about the test runner.
 */
export default <TestSuite>{
  'disconnect & isConnected': async (api, address) => {
    assert.strictEqual(api.isConnected(), true)
    await api.disconnect()
    assert.strictEqual(api.isConnected(), false)
  }
}
