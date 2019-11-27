import requests from '../../fixtures/requests'
import responses from '../../fixtures/responses'
import { assertRejects, assertResultMatch, TestSuite } from '../../utils'
const instructionsWithMaxLedgerVersionOffset = { maxLedgerVersionOffset: 100 }

/**
 * Every test suite exports their tests in the default object.
 * - Check out the "TestSuite" type for documentation on the interface.
 * - Check out "test/api/index.ts" for more information about the test runner.
 */
export default <TestSuite>{
  'buy order': async (api, address) => {
    const request = requests.prepareOrder.buy
    const result = await api.prepareOrder(address, request)
    assertResultMatch(result, responses.prepareOrder.buy, 'prepare')
  },

  'buy order with expiration': async (api, address) => {
    const request = requests.prepareOrder.expiration
    const response = responses.prepareOrder.expiration
    const result = await api.prepareOrder(
      address,
      request,
      instructionsWithMaxLedgerVersionOffset
    )
    assertResultMatch(result, response, 'prepare')
  },

  'sell order': async (api, address) => {
    const request = requests.prepareOrder.sell
    const result = await api.prepareOrder(
      address,
      request,
      instructionsWithMaxLedgerVersionOffset
    )
    assertResultMatch(result, responses.prepareOrder.sell, 'prepare')
  },

  'invalid': async (api, address) => {
    const request = Object.assign({}, requests.prepareOrder.sell)
    delete request.direction // Make invalid
    await assertRejects(
      api.prepareOrder(
        address,
        request,
        instructionsWithMaxLedgerVersionOffset
      ),
      api.errors.ValidationError,
      'instance.order requires property "direction"'
    )
  }
}
