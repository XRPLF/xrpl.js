import responses from '../../fixtures/responses'
import {assertResultMatch, TestSuite} from '../../testUtils'

/**
 * Every test suite exports their tests in the default object.
 * - Check out the "TestSuite" type for documentation on the interface.
 * - Check out "test/client/index.ts" for more information about the test runner.
 */
export default <TestSuite>{
  'getBalances': async (client, address) => {
    const result = await client.getBalances(address)
    assertResultMatch(result, responses.getBalances, 'getBalances')
  },

  'getBalances - limit': async (client, address) => {
    const options = {limit: 3, ledgerVersion: 123456}
    const expectedResponse = responses.getBalances.slice(0, 3)
    const result = await client.getBalances(address, options)
    assertResultMatch(result, expectedResponse, 'getBalances')
  },

  'getBalances - limit & currency': async (client, address) => {
    const options = {currency: 'USD', limit: 3}
    const expectedResponse = responses.getBalances
      .filter((item) => item.currency === 'USD')
      .slice(0, 3)
    const result = await client.getBalances(address, options)
    assertResultMatch(result, expectedResponse, 'getBalances')
  },

  'getBalances - limit & currency & issuer': async (client, address) => {
    const options = {
      currency: 'USD',
      counterparty: 'rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B',
      limit: 3
    }
    const expectedResponse = responses.getBalances
      .filter(
        (item) =>
          item.currency === 'USD' &&
          item.counterparty === 'rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B'
      )
      .slice(0, 3)
    const result = await client.getBalances(address, options)
    assertResultMatch(result, expectedResponse, 'getBalances')
  }
}
