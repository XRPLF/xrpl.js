import assert from 'assert-diff'
import { TestSuite } from '../../utils'
import { RippleAPI } from 'ripple-api'

/**
 * Every test suite exports their tests in the default object.
 * - Check out the "TestSuite" type for documentation on the interface.
 * - Check out "test/api/index.ts" for more information about the test runner.
 */
export default <TestSuite>{
  'RippleAPI - implicit server port': () => {
    new RippleAPI({ server: 'wss://s1.ripple.com' })
  },

  'RippleAPI invalid options': () => {
    // @ts-ignore - This is intentionally invalid
    assert.throws(() => new RippleAPI({ invalid: true }))
  },

  'RippleAPI valid options': () => {
    const api = new RippleAPI({ server: 'wss://s:1' })
    const privateConnectionUrl = (api.connection as any)._url
    assert.deepEqual(privateConnectionUrl, 'wss://s:1')
  },

  'RippleAPI invalid server uri': () => {
    assert.throws(() => new RippleAPI({ server: 'wss//s:1' }))
  }
}
