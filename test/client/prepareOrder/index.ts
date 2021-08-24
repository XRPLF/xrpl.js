import requests from '../../fixtures/requests'
import responses from '../../fixtures/responses'
import rippled from '../../fixtures/rippled'
import {assertRejects, assertResultMatch, TestSuite} from '../../utils'
const instructionsWithMaxLedgerVersionOffset = {maxLedgerVersionOffset: 100}

/**
 * Every test suite exports their tests in the default object.
 * - Check out the "TestSuite" type for documentation on the interface.
 * - Check out "test/client/index.ts" for more information about the test runner.
 */
export default <TestSuite>{
  'buy order': async (client, address, mockRippled) => {
    mockRippled.addResponse({command: 'server_info'}, rippled.server_info.normal)
    const request = requests.prepareOrder.buy
    const result = await client.prepareOrder(address, request)
    assertResultMatch(result, responses.prepareOrder.buy, 'prepare')
  },

  'buy order with expiration': async (client, address, mockRippled) => {
    mockRippled.addResponse({command: 'server_info'}, rippled.server_info.normal)
    const request = requests.prepareOrder.expiration
    const response = responses.prepareOrder.expiration
    const result = await client.prepareOrder(
      address,
      request,
      instructionsWithMaxLedgerVersionOffset
    )
    assertResultMatch(result, response, 'prepare')
  },

  'sell order': async (client, address, mockRippled) => {
    mockRippled.addResponse({command: 'server_info'}, rippled.server_info.normal)
    const request = requests.prepareOrder.sell
    const result = await client.prepareOrder(
      address,
      request,
      instructionsWithMaxLedgerVersionOffset
    )
    assertResultMatch(result, responses.prepareOrder.sell, 'prepare')
  },

  'invalid': async (client, address, mockRippled) => {
    mockRippled.addResponse({command: 'server_info'}, rippled.server_info.normal)
    const request = Object.assign({}, requests.prepareOrder.sell)
    delete request.direction // Make invalid
    await assertRejects(
      client.prepareOrder(
        address,
        request,
        instructionsWithMaxLedgerVersionOffset
      ),
      client.errors.ValidationError,
      'instance.order requires property "direction"'
    )
  },

  'with ticket': async (client, address, mockRippled) => {
    mockRippled.addResponse({command: 'server_info'}, rippled.server_info.normal)
    const request = requests.prepareOrder.sell
    const localInstructions = {
      ...instructionsWithMaxLedgerVersionOffset,
      maxFee: '0.000012',
      ticketSequence: 23
    }
    const result = await client.prepareOrder(address, request, localInstructions)
    assertResultMatch(result, responses.prepareOrder.ticket, 'prepare')
  }
}
