import assert from 'assert-diff'
import {TestSuite} from '../../utils'
import {Client} from 'xrpl-local'

/**
 * Every test suite exports their tests in the default object.
 * - Check out the "TestSuite" type for documentation on the interface.
 * - Check out "test/client/index.ts" for more information about the test runner.
 */
export default <TestSuite>{
  'Client - implicit server port': () => {
    new Client({server: 'wss://s1.ripple.com'})
  },

  'Client invalid options': () => {
    // @ts-ignore - This is intentionally invalid
    assert.throws(() => new Client({invalid: true}))
  },

  'Client valid options': () => {
    const client = new Client({server: 'wss://s:1'})
    const privateConnectionUrl = (client.connection as any)._url
    assert.deepEqual(privateConnectionUrl, 'wss://s:1')
  },

  'Client invalid server uri': () => {
    assert.throws(() => new Client({server: 'wss//s:1'}))
  }
}
