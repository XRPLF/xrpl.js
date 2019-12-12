import { assertRejects, assertResultMatch, TestSuite } from '../../utils'

/**
 * Every test suite exports their tests in the default object.
 * - Check out the "TestSuite" type for documentation on the interface.
 * - Check out "test/api/index.ts" for more information about the test runner.
 */
export default <TestSuite>{
  'getBalanceSheet': async (api, address) => {
    await api.getBalanceSheet(address)
  },

  'getBalanceSheet - invalid options': async (api, address) => {
    await assertRejects(
      // @ts-ignore - This is intentionally invalid
      api.getBalanceSheet(address, { invalid: 'options' }),
      api.errors.ValidationError
    )
  },

  'getBalanceSheet - empty': async (api, address) => {
    const options = { ledgerVersion: 123456 }
    const result = await api.getBalanceSheet(address, options)
    assertResultMatch(result, {}, 'getBalanceSheet')
  }
}
