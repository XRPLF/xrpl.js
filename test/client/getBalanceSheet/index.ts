import {assertRejects, assertResultMatch, TestSuite} from '../../utils'

/**
 * Every test suite exports their tests in the default object.
 * - Check out the "TestSuite" type for documentation on the interface.
 * - Check out "test/client/index.ts" for more information about the test runner.
 */
export default <TestSuite>{
  'getBalanceSheet': async (client, address) => {
    await client.getBalanceSheet(address)
  },

  'getBalanceSheet - invalid options': async (client, address) => {
    await assertRejects(
      // @ts-ignore - This is intentionally invalid
      client.getBalanceSheet(address, {invalid: 'options'}),
      client.errors.ValidationError
    )
  },

  'getBalanceSheet - empty': async (client, address) => {
    const options = {ledgerVersion: 123456}
    const result = await client.getBalanceSheet(address, options)
    assertResultMatch(result, {}, 'getBalanceSheet')
  }
}
