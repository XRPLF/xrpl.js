import responses from '../../fixtures/responses'
import {assertRejects, assertResultMatch, TestSuite} from '../../utils'
const {getPaymentChannel: RESPONSE_FIXTURES} = responses

/**
 * Every test suite exports their tests in the default object.
 * - Check out the "TestSuite" type for documentation on the interface.
 * - Check out "test/client/index.ts" for more information about the test runner.
 */
export default <TestSuite>{
  'getPaymentChannel': async (client, address) => {
    const channelId =
      'E30E709CF009A1F26E0E5C48F7AA1BFB79393764F15FB108BDC6E06D3CBD8415'
    const result = await client.getPaymentChannel(channelId)
    assertResultMatch(result, RESPONSE_FIXTURES.normal, 'getPaymentChannel')
  },

  'getPaymentChannel - full': async (client, address) => {
    const channelId =
      'D77CD4713AA08195E6B6D0E5BC023DA11B052EBFF0B5B22EDA8AE85345BCF661'
    const result = await client.getPaymentChannel(channelId)
    assertResultMatch(result, RESPONSE_FIXTURES.full, 'getPaymentChannel')
  },

  'getPaymentChannel - not found': async (client, address) => {
    const channelId =
      'DFA557EA3497585BFE83F0F97CC8E4530BBB99967736BB95225C7F0C13ACE708'
    await assertRejects(
      client.getPaymentChannel(channelId),
      client.errors.RippledError,
      'entryNotFound'
    )
  },

  'getPaymentChannel - wrong type': async (client, address) => {
    const channelId =
      '8EF9CCB9D85458C8D020B3452848BBB42EAFDDDB69A93DD9D1223741A4CA562B'
    await assertRejects(
      client.getPaymentChannel(channelId),
      client.errors.NotFoundError,
      'Payment channel ledger entry not found'
    )
  }
}
