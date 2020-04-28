import requests from '../../fixtures/requests'
import responses from '../../fixtures/responses'
import {assertResultMatch, TestSuite} from '../../utils'
const instructionsWithMaxLedgerVersionOffset = {maxLedgerVersionOffset: 100}

/**
 * Every test suite exports their tests in the default object.
 * - Check out the "TestSuite" type for documentation on the interface.
 * - Check out "test/api/index.ts" for more information about the test runner.
 */
export default <TestSuite>{
  'prepareEscrowCancellation': async (api, address) => {
    const result = await api.prepareEscrowCancellation(
      address,
      requests.prepareEscrowCancellation.normal,
      instructionsWithMaxLedgerVersionOffset
    )
    assertResultMatch(
      result,
      responses.prepareEscrowCancellation.normal,
      'prepare'
    )
  },

  'prepareEscrowCancellation with memos': async (api, address) => {
    const result = await api.prepareEscrowCancellation(
      address,
      requests.prepareEscrowCancellation.memos
    )
    assertResultMatch(
      result,
      responses.prepareEscrowCancellation.memos,
      'prepare'
    )
  }
}
