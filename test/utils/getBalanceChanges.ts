import { assert } from 'chai'

import { getBalanceChanges } from '../../src/utils'
import paymentXrpCreateAccount from '../fixtures/utils/paymentXrpCreateAccount.json'

describe('getBalanceChanges', function () {
  it('test1', function () {
    const result = getBalanceChanges(paymentXrpCreateAccount.metadata)
    const expected = [
      {
        address: 'rLDYrujdKUfVx28T9vRDAbyJ7G2WVXKo4K',
        balances: [{ currency: 'XRP', value: '100' }],
      },
      {
        address: 'rKmBGxocj9Abgy25J51Mk1iqFzW9aVF9Tc',
        balances: [{ currency: 'XRP', value: '-100.012' }],
      },
    ]
    assert.deepStrictEqual(result, expected)
  })
})
