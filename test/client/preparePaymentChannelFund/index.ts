import requests from '../../fixtures/requests'
import responses from '../../fixtures/responses'
import rippled from '../../fixtures/rippled'
import {assertResultMatch, TestSuite} from '../../utils'
const instructionsWithMaxLedgerVersionOffset = {maxLedgerVersionOffset: 100}

/**
 * Every test suite exports their tests in the default object.
 * - Check out the "TestSuite" type for documentation on the interface.
 * - Check out "test/client/index.ts" for more information about the test runner.
 */
export default <TestSuite>{
  'preparePaymentChannelFund': async (client, address, mockRippled) => {
    mockRippled.addResponse({command: 'server_info'}, rippled.server_info.normal)
    const localInstructions = {
      ...instructionsWithMaxLedgerVersionOffset,
      maxFee: '0.000012'
    }
    const result = await client.preparePaymentChannelFund(
      address,
      requests.preparePaymentChannelFund.normal,
      localInstructions
    )
    assertResultMatch(
      result,
      responses.preparePaymentChannelFund.normal,
      'prepare'
    )
  },

  'preparePaymentChannelFund full': async (client, address, mockRippled) => {
    mockRippled.addResponse({command: 'server_info'}, rippled.server_info.normal)
    const result = await client.preparePaymentChannelFund(
      address,
      requests.preparePaymentChannelFund.full
    )
    assertResultMatch(
      result,
      responses.preparePaymentChannelFund.full,
      'prepare'
    )
  },

  'with ticket': async (client, address, mockRippled) => {
    mockRippled.addResponse({command: 'server_info'}, rippled.server_info.normal)
    const localInstructions = {
      ...instructionsWithMaxLedgerVersionOffset,
      maxFee: '0.000012',
      ticketSequence: 23
    }
    const result = await client.preparePaymentChannelFund(
      address,
      requests.preparePaymentChannelFund.normal,
      localInstructions
    )
    assertResultMatch(
      result,
      responses.preparePaymentChannelFund.ticket,
      'prepare'
    )
  }
}
