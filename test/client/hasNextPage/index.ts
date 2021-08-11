import assert from 'assert-diff'
import {TestSuite} from '../../utils'

/**
 * Every test suite exports their tests in the default object.
 * - Check out the "TestSuite" type for documentation on the interface.
 * - Check out "test/client/index.ts" for more information about the test runner.
 */
export default <TestSuite>{
  'returns true when there is another page': async (client, address) => {
    // @ts-ignore
    const response = await client.request({command: 'ledger_data'})
    assert(client.hasNextPage(response))
  },

  'returns false when there are no more pages': async (client, address) => {
    // @ts-ignore
    const response = await client.request({command: 'ledger_data'})
    const responseNextPage = await client.requestNextPage(
      // @ts-ignore
      {command: 'ledger_data'},
      response
    )
    assert(!client.hasNextPage(responseNextPage))
  }
}
