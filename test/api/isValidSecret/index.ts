import assert from 'assert-diff'
import {TestSuite} from '../../utils'

export default <TestSuite>{
  'returns true for valid secret': async (api, address) => {
    assert(api.isValidSecret('snsakdSrZSLkYpCXxfRkS4Sh96PMK'))
  },

  'returns false for invalid secret': async (api, address) => {
    assert(!api.isValidSecret('foobar'))
  }
}
