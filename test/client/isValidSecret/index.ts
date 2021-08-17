import assert from 'assert-diff'
import {TestSuite} from '../../utils'

export default <TestSuite>{
  'returns true for valid secret': async (client, address) => {
    assert(client.isValidSecret('snsakdSrZSLkYpCXxfRkS4Sh96PMK'))
  },

  'returns false for invalid secret': async (client, address) => {
    assert(!client.isValidSecret('foobar'))
  }
}
