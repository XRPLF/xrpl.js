import requests from '../../fixtures/requests'
import responses from '../../fixtures/responses'
import rippled from '../../fixtures/rippled'
import {assertResultMatch, TestSuite} from '../../testUtils'
const instructionsWithMaxLedgerVersionOffset = {maxLedgerVersionOffset: 100}

/**
 * Every test suite exports their tests in the default object.
 * - Check out the "TestSuite" type for documentation on the interface.
 * - Check out "test/client/index.ts" for more information about the test runner.
 */
export default <TestSuite>{
  'prepareCheckCancel': async (client, address, mockRippled) => {
    mockRippled.addResponse({command: 'server_info'}, rippled.server_info.normal)
    const result = await client.prepareCheckCancel(
      address,
      requests.prepareCheckCancel.normal
    )
    assertResultMatch(result, responses.prepareCheckCancel.normal, 'prepare')
  },

  'with ticket': async (client, address, mockRippled) => {
    mockRippled.addResponse({command: 'server_info'}, rippled.server_info.normal)
    const localInstructions = {
      ...instructionsWithMaxLedgerVersionOffset,
      maxFee: '0.000012',
      ticketSequence: 23
    }
    const result = await client.prepareCheckCancel(
      address,
      requests.prepareCheckCancel.normal,
      localInstructions
    )
    assertResultMatch(result, responses.prepareCheckCancel.ticket, 'prepare')
  }
}
