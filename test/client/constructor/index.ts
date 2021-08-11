import assert from 'assert-diff'
import {TestSuite} from '../../utils'
import {XrplClient} from 'xrpl-client'

/**
 * Every test suite exports their tests in the default object.
 * - Check out the "TestSuite" type for documentation on the interface.
 * - Check out "test/client/index.ts" for more information about the test runner.
 */
export default <TestSuite>{
  'XrplClient - implicit server port': () => {
    new XrplClient({server: 'wss://s1.ripple.com'})
  },

  'XrplClient invalid options': () => {
    // @ts-ignore - This is intentionally invalid
    assert.throws(() => new XrplClient({invalid: true}))
  },

  'XrplClient valid options': () => {
    const client = new XrplClient({server: 'wss://s:1'})
    const privateConnectionUrl = (client.connection as any)._url
    assert.deepEqual(privateConnectionUrl, 'wss://s:1')
  },

  'XrplClient invalid server uri': () => {
    assert.throws(() => new XrplClient({server: 'wss//s:1'}))
  }
}
