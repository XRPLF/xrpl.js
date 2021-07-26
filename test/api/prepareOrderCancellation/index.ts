import requests from '../../fixtures/requests'
import responses from '../../fixtures/responses'
import {assertRejects, assertResultMatch, TestSuite} from '../../utils'
const instructionsWithMaxLedgerVersionOffset = {maxLedgerVersionOffset: 100}

/**
 * Every test suite exports their tests in the default object.
 * - Check out the "TestSuite" type for documentation on the interface.
 * - Check out "test/api/index.ts" for more information about the test runner.
 */
export default <TestSuite>{
  'prepareOrderCancellation': async (api, address) => {
    const request = requests.prepareOrderCancellation.simple
    const result = await api.prepareOrderCancellation(
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

  'no instructions': async (api, address) => {
    const request = requests.prepareOrderCancellation.simple
    const result = await api.prepareOrderCancellation(address, request)
    assertResultMatch(
      result,
      responses.prepareOrderCancellation.noInstructions,
      'prepare'
    )
  },

  'with memos': async (api, address) => {
    const request = requests.prepareOrderCancellation.withMemos
    const result = await api.prepareOrderCancellation(address, request)
    assertResultMatch(
      result,
      responses.prepareOrderCancellation.withMemos,
      'prepare'
    )
  },

  'invalid': async (api, address) => {
    const request = Object.assign(
      {},
      requests.prepareOrderCancellation.withMemos
    )
    delete request.orderSequence // Make invalid

    await assertRejects(
      api.prepareOrderCancellation(address, request),
      api.errors.ValidationError,
      'instance.orderCancellation requires property "orderSequence"'
    )
  },

  'with ticket': async (api, address) => {
    const request = requests.prepareOrderCancellation.simple
    const localInstructions = {
      ...instructionsWithMaxLedgerVersionOffset,
      maxFee: '0.000012',
      ticketSequence: 23
    }
    const result = await api.prepareOrderCancellation(
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
