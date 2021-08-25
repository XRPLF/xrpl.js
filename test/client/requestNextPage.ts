import assert from 'assert-diff'
import {assertRejects, TestSuite} from '../testUtils'

/**
 * Every test suite exports their tests in the default object.
 * - Check out the "TestSuite" type for documentation on the interface.
 * - Check out "test/client/index.ts" for more information about the test runner.
 */
export default <TestSuite>{
  'requests the next page': async (client, address) => {
    // @ts-ignore
    const response = await client.request({command: 'ledger_data'})
    const responseNextPage = await client.requestNextPage(
      // @ts-ignore
      {command: 'ledger_data'},
      response
    )
    assert.equal(
      // @ts-ignore
      responseNextPage.result.state[0].index,
      '000B714B790C3C79FEE00D17C4DEB436B375466F29679447BA64F265FD63D731'
    )
  },

  'rejects when there are no more pages': async (client, address) => {
    // @ts-ignore
    const response = await client.request({command: 'ledger_data'})
    const responseNextPage = await client.requestNextPage(
      // @ts-ignore
      {command: 'ledger_data'},
      response
    )
    assert(!client.hasNextPage(responseNextPage))
    await assertRejects(
      // @ts-ignore
      client.requestNextPage({command: 'ledger_data'}, responseNextPage),
      Error,
      'response does not have a next page'
    )
  }
}
