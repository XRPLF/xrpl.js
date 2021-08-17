import assert from 'assert-diff'
import {TestSuite} from '../../utils'

/**
 * Every test suite exports their tests in the default object.
 * - Check out the "TestSuite" type for documentation on the interface.
 * - Check out "test/client/index.ts" for more information about the test runner.
 */
export default <TestSuite>{
  'returns keypair for secret': async (client, address) => {
    var keypair = client.deriveKeypair('snsakdSrZSLkYpCXxfRkS4Sh96PMK')
    assert.equal(
      keypair.privateKey,
      '008850736302221AFD59FF9CA1A29D4975F491D726249302EE48A3078A8934D335'
    )
    assert.equal(
      keypair.publicKey,
      '035332FBA71D705BD5D97014A833BE2BBB25BEFCD3506198E14AFEA241B98C2D06'
    )
  },

  'returns keypair for ed25519 secret': async (client, address) => {
    var keypair = client.deriveKeypair('sEdV9eHWbibBnTj7b1H5kHfPfv7gudx')
    assert.equal(
      keypair.privateKey,
      'ED5C2EF6C2E3200DFA6B72F47935C7F64D35453646EA34919192538F458C7BC30F'
    )
    assert.equal(
      keypair.publicKey,
      'ED0805EC4E728DB87C0CA6C420751F296C57A5F42D02E9E6150CE60694A44593E5'
    )
  },

  'throws with an invalid secret': async (client, address) => {
    assert.throws(() => {
      client.deriveKeypair('...')
    }, /^Error: Non-base58 character$/)
  }
}
