import requests from '../../fixtures/requests'
import responses from '../../fixtures/responses'
import { assertResultMatch, TestSuite } from '../../utils'

/**
 * Every test suite exports their tests in the default object.
 * - Check out the "TestSuite" type for documentation on the interface.
 * - Check out "test/api/index.ts" for more information about the test runner.
 */
export default <TestSuite>{
  'prepareCheckCash amount': async (api, address) => {
    const result = await api.prepareCheckCash(
      address,
      requests.prepareCheckCash.amount
    )
    assertResultMatch(result, responses.prepareCheckCash.amount, 'prepare')
  },

  'prepareCheckCash deliverMin': async (api, address) => {
    const result = await api.prepareCheckCash(
      address,
      requests.prepareCheckCash.deliverMin
    )
    assertResultMatch(result, responses.prepareCheckCash.deliverMin, 'prepare')
  }
}
