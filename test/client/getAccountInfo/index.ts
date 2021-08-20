import assert from 'assert'
import _ from 'lodash'
import responses from '../../fixtures/rippled'
import {assertRejects, TestSuite} from '../../utils'

/**
 * Every test suite exports their tests in the default object.
 * - Check out the "TestSuite" type for documentation on the interface.
 * - Check out "test/client/index.ts" for more information about the test runner.
 */
export default <TestSuite>{
  'getAccountInfo': async (client, address) => {
    const response = await client.getAccountInfo(address)
    assert.deepEqual(
      _.omit(response, 'id'),
      _.omit(responses.account_info.normal, 'id'),
    )
  },

  'getAccountInfo - options undefined': async (client, address) => {
    const response = await client.getAccountInfo(address, undefined)
    assert.deepEqual(
      _.omit(response, 'id'),
      _.omit(responses.account_info.normal, 'id'),
    )
  },

  'getAccountInfo - invalid options': async (client, address) => {
    await assertRejects(
      // @ts-ignore - This is intentionally invalid
      client.getAccountInfo(address, {invalid: 'options'}),
      client.errors.ValidationError
    )
  }
}
