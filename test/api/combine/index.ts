import assert from 'assert-diff'
import binary from 'ripple-binary-codec'
import requests from '../../fixtures/requests'
import responses from '../../fixtures/responses'
import {assertResultMatch, TestSuite} from '../../utils'
const {combine: REQUEST_FIXTURES} = requests
const {combine: RESPONSE_FIXTURES} = responses

/**
 * Every test suite exports their tests in the default object.
 * - Check out the "TestSuite" type for documentation on the interface.
 * - Check out "test/api/index.ts" for more information about the test runner.
 */
export default <TestSuite>{
  'combine': async (api, address) => {
    const combined = api.combine(REQUEST_FIXTURES.setDomain)
    assertResultMatch(combined, RESPONSE_FIXTURES.single, 'sign')
  },

  'combine - different transactions': async (api, address) => {
    const request = [REQUEST_FIXTURES.setDomain[0]]
    const tx = binary.decode(REQUEST_FIXTURES.setDomain[0])
    tx.Flags = 0
    request.push(binary.encode(tx))
    assert.throws(() => {
      api.combine(request)
    }, /txJSON is not the same for all signedTransactions/)
  }
}
