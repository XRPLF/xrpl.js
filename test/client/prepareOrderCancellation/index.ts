import requests from '../../fixtures/requests'
import responses from '../../fixtures/responses'
import {assertRejects, assertResultMatch, TestSuite} from '../../utils'
const instructionsWithMaxLedgerVersionOffset = {maxLedgerVersionOffset: 100}

/**
 * Every test suite exports their tests in the default object.
 * - Check out the "TestSuite" type for documentation on the interface.
 * - Check out "test/client/index.ts" for more information about the test runner.
 */
export default <TestSuite>{
  'prepareOrderCancellation': async (client, address) => {
    const request = requests.prepareOrderCancellation.simple
    const result = await client.prepareOrderCancellation(
      address,
      request,
      instructionsWithMaxLedgerVersionOffset
    )
    assertResultMatch(
      result,
      responses.prepareOrderCancellation.normal,
      'prepare'
    )
  },

  'no instructions': async (client, address) => {
    const request = requests.prepareOrderCancellation.simple
    const result = await client.prepareOrderCancellation(address, request)
    assertResultMatch(
      result,
      responses.prepareOrderCancellation.noInstructions,
      'prepare'
    )
  },

  'with memos': async (client, address) => {
    const request = requests.prepareOrderCancellation.withMemos
    const result = await client.prepareOrderCancellation(address, request)
    assertResultMatch(
      result,
      responses.prepareOrderCancellation.withMemos,
      'prepare'
    )
  },

  'invalid': async (client, address) => {
    const request = Object.assign(
      {},
      requests.prepareOrderCancellation.withMemos
    )
    delete request.orderSequence // Make invalid

    await assertRejects(
      client.prepareOrderCancellation(address, request),
      client.errors.ValidationError,
      'instance.orderCancellation requires property "orderSequence"'
    )
  },

  'with ticket': async (client, address) => {
    const request = requests.prepareOrderCancellation.simple
    const localInstructions = {
      ...instructionsWithMaxLedgerVersionOffset,
      maxFee: '0.000012',
      ticketSequence: 23
    }
    const result = await client.prepareOrderCancellation(
      address,
      request,
      localInstructions
    )
    assertResultMatch(
      result,
      responses.prepareOrderCancellation.ticket,
      'prepare'
    )
  }
}
