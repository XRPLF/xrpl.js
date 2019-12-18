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
  'prepareCheckCreate': async (api, address) => {
    const localInstructions = {
      ...instructionsWithMaxLedgerVersionOffset,
      maxFee: '0.000012'
    }
    const result = await api.prepareCheckCreate(
      address,
      requests.prepareCheckCreate.normal,
      localInstructions
    )
    assertResultMatch(result, responses.prepareCheckCreate.normal, 'prepare')
  },

  'prepareCheckCreate full': async (api, address) => {
    const result = await api.prepareCheckCreate(
      address,
      requests.prepareCheckCreate.full
    )
    assertResultMatch(result, responses.prepareCheckCreate.full, 'prepare')
  }
}
