import requests from '../../fixtures/requests'
import responses from '../../fixtures/responses'
import rippled from '../../fixtures/rippled'
import {assertResultMatch, TestSuite} from '../../testUtils'
const instructionsWithMaxLedgerVersionOffset = {maxLedgerVersionOffset: 100}

export const config = {
  // TODO: The mock server right now returns a hard-coded string, no matter
  // what "Account" value you pass. We'll need it to support more accurate
  // responses before we can turn these tests on.
  skipXAddress: true
}

/**
 * Every test suite exports their tests in the default object.
 * - Check out the "TestSuite" type for documentation on the interface.
 * - Check out "test/client/index.ts" for more information about the test runner.
 */
export default <TestSuite>{
  'preparePaymentChannelCreate': async (client, address, mockRippled) => {
    mockRippled.addResponse({command: 'server_info'}, rippled.server_info.normal)
    const localInstructions = {
      ...instructionsWithMaxLedgerVersionOffset,
      maxFee: '0.000012'
    }
    const result = await client.preparePaymentChannelCreate(
      address,
      requests.preparePaymentChannelCreate.normal,
      localInstructions
    )
    assertResultMatch(
      result,
      responses.preparePaymentChannelCreate.normal,
      'prepare'
    )
  },

  'preparePaymentChannelCreate full': async (client, address, mockRippled) => {
    mockRippled.addResponse({command: 'server_info'}, rippled.server_info.normal)
    const result = await client.preparePaymentChannelCreate(
      address,
      requests.preparePaymentChannelCreate.full
    )
    assertResultMatch(
      result,
      responses.preparePaymentChannelCreate.full,
      'prepare'
    )
  },

  'preparePaymentChannelCreate with ticket': async (client, address, mockRippled) => {
    mockRippled.addResponse({command: 'server_info'}, rippled.server_info.normal)
    const localInstructions = {
      ...instructionsWithMaxLedgerVersionOffset,
      maxFee: '0.000012',
      ticketSequence: 23
    }
    const result = await client.preparePaymentChannelCreate(
      address,
      requests.preparePaymentChannelCreate.normal,
      localInstructions
    )
    assertResultMatch(
      result,
      responses.preparePaymentChannelCreate.ticket,
      'prepare'
    )
  }
}
