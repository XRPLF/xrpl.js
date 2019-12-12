import assert from 'assert-diff'
import { TestSuite } from '../../utils'
import addresses from '../../fixtures/addresses.json'

export default <TestSuite>{
  'returns true for valid address': async (api, address) => {
    assert(api.isValidAddress('rLczgQHxPhWtjkaQqn3Q6UM8AbRbbRvs5K'))
    assert(api.isValidAddress(addresses.ACCOUNT_X))
    assert(api.isValidAddress(addresses.ACCOUNT_T))
  },

  'returns false for invalid address': async (api, address) => {
    assert(!api.isValidAddress('foobar'))
    assert(!api.isValidAddress(addresses.ACCOUNT_X.slice(0, -1)))
    assert(!api.isValidAddress(addresses.ACCOUNT_T.slice(1)))
  }
}
