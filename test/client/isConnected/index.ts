import assert from 'assert-diff'
import {TestSuite} from '../../testUtils'

/**
 * Every test suite exports their tests in the default object.
 * - Check out the "TestSuite" type for documentation on the interface.
 * - Check out "test/client/index.ts" for more information about the test runner.
 */
export default <TestSuite>{
  'disconnect & isConnected': async (client, address) => {
    assert.strictEqual(client.isConnected(), true)
    await client.disconnect()
    assert.strictEqual(client.isConnected(), false)
  }
}
