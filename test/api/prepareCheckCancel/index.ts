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
  'prepareCheckCancel': async (api, address) => {
    const result = await api.prepareCheckCancel(
      address,
      requests.prepareCheckCancel.normal
    )
    assertResultMatch(result, responses.prepareCheckCancel.normal, 'prepare')
  },

  'with ticket': async (api, address) => {
    const localInstructions = {
      ...instructionsWithMaxLedgerVersionOffset,
      maxFee: '0.000012',
      ticketSequence: 23
    }
    const result = await api.prepareCheckCancel(
      address,
      requests.prepareCheckCancel.normal,
      localInstructions
    )
    assertResultMatch(result, responses.prepareCheckCancel.ticket, 'prepare')
  }
}
