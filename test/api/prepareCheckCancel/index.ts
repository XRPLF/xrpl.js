import requests from '../../fixtures/requests'
import responses from '../../fixtures/responses'
import {assertResultMatch, TestSuite} from '../../utils'

/**
 * Every test suite exports their tests in the default object.
 * - Check out the "TestSuite" type for documentation on the interface.
 * - Check out "test/api/index.ts" for more information about the test runner.
 */
export default <TestSuite>{
  prepareCheckCancel: async (api, address) => {
    const result = await api.prepareCheckCancel(
      address,
      requests.prepareCheckCancel.normal
    )
    assertResultMatch(result, responses.prepareCheckCancel.normal, 'prepare')
  }
}
