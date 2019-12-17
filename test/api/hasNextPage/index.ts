import assert from 'assert-diff'
import {TestSuite} from '../../utils'

/**
 * Every test suite exports their tests in the default object.
 * - Check out the "TestSuite" type for documentation on the interface.
 * - Check out "test/api/index.ts" for more information about the test runner.
 */
export default <TestSuite>{
  'returns true when there is another page': async (api, address) => {
    const response = await api.request('ledger_data')
    assert(api.hasNextPage(response))
  },

  'returns false when there are no more pages': async (api, address) => {
    const response = await api.request('ledger_data')
    const responseNextPage = await api.requestNextPage(
      'ledger_data',
      {},
      response
    )
    assert(!api.hasNextPage(responseNextPage))
  }
}
