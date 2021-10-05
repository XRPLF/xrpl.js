import { getBalanceChanges } from '../../src/utils'
import paymentXrpCreateAccount from '../fixtures/utils/paymentXrpCreateAccount.json'

describe('getBalanceChanges', function () {
  it('test1', function () {
    const result = getBalanceChanges(paymentXrpCreateAccount.metadata)
    const expected = {
      rLDYrujdKUfVx28T9vRDAbyJ7G2WVXKo4K: [
        {
          value: '100',
          currency: 'XRP',
        },
      ],
      rKmBGxocj9Abgy25J51Mk1iqFzW9aVF9Tc: [
        {
          value: '-100.012',
          currency: 'XRP',
        },
      ],
    }
    console.log(result)
    console.log(expected)
  })
})
