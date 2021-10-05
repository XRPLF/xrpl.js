import { assert } from 'chai'

import { getBalanceChanges } from '../../src/utils'
import paymentIouDestinationNoBalance from '../fixtures/utils/paymentIouDestinationNoBalance.json'
import paymentXrpCreateAccount from '../fixtures/utils/paymentXrpCreateAccount.json'

describe('getBalanceChanges', function () {
  it('XRP create account', function () {
    const result = getBalanceChanges(paymentXrpCreateAccount.metadata)
    const expected = [
      {
        account: 'rLDYrujdKUfVx28T9vRDAbyJ7G2WVXKo4K',
        balances: [{ currency: 'XRP', value: '100' }],
      },
      {
        account: 'rKmBGxocj9Abgy25J51Mk1iqFzW9aVF9Tc',
        balances: [{ currency: 'XRP', value: '-100.012' }],
      },
    ]
    assert.deepStrictEqual(result, expected)
  })

  it('USD payment to account with no USD', function () {
    const expected = [
      {
        account: 'rKmBGxocj9Abgy25J51Mk1iqFzW9aVF9Tc',
        balances: [
          {
            value: '-0.01',
            currency: 'USD',
            issuer: 'rMwjYedjc7qqtKYVLiAccJSmCwih4LnE2q',
          },
          {
            value: '-0.012',
            currency: 'XRP',
          },
        ],
      },
      {
        account: 'rMwjYedjc7qqtKYVLiAccJSmCwih4LnE2q',
        balances: [
          {
            issuer: 'rKmBGxocj9Abgy25J51Mk1iqFzW9aVF9Tc',
            currency: 'USD',
            value: '0.01',
          },
          {
            issuer: 'rLDYrujdKUfVx28T9vRDAbyJ7G2WVXKo4K',
            currency: 'USD',
            value: '-0.01',
          },
        ],
      },
      {
        account: 'rLDYrujdKUfVx28T9vRDAbyJ7G2WVXKo4K',
        balances: [
          {
            issuer: 'rMwjYedjc7qqtKYVLiAccJSmCwih4LnE2q',
            currency: 'USD',
            value: '0.01',
          },
        ],
      },
    ]
    const result = getBalanceChanges(paymentIouDestinationNoBalance.metadata)
    assert.deepStrictEqual(result, expected)
  })

  // it('USD payment of all USD in source account', function () {
  //   const paymentResponse = loadFixture('payment-iou-spend-full-balance.json')
  //   const result = getBalanceChanges(paymentResponse.metadata)
  //   assert.deepStrictEqual(result, expected)
  // })

  // it('USD payment to account with USD', function () {
  //   const paymentResponse = loadFixture('payment-iou.json')
  //   const result = getBalanceChanges(paymentResponse.metadata)
  //   assert.deepStrictEqual(result, expected)
  // })

  // it('Set trust limit to 0 with balance remaining', function () {
  //   const paymentResponse = loadFixture('trustline-set-limit-to-zero.json')
  //   const result = getBalanceChanges(paymentResponse.metadata)
  //   assert.deepStrictEqual(result, expected)
  // })

  // it('Create trustline', function () {
  //   const paymentResponse = loadFixture('trustline-create.json')
  //   const result = getBalanceChanges(paymentResponse.metadata)
  //   assert.deepStrictEqual(result, expected)
  // })

  // it('Set trustline', function () {
  //   const paymentResponse = loadFixture('trustline-set-limit.json')
  //   const result = getBalanceChanges(paymentResponse.metadata)
  //   assert.deepStrictEqual(result, expected)
  // })

  // it('Set trustline 2', function () {
  //   const paymentResponse = loadFixture('trustline-set-limit-2.json')
  //   const result = getBalanceChanges(paymentResponse.metadata)
  //   assert.deepStrictEqual(result, expected)
  // })

  // it('Delete trustline', function () {
  //   const paymentResponse = loadFixture('trustline-delete.json')
  //   const result = getBalanceChanges(paymentResponse.metadata)
  //   assert.deepStrictEqual(result, expected)
  // })

  // it('Redeem USD', function () {
  //   const paymentResponse = loadFixture('payment-iou-redeem.json')
  //   const result = getBalanceChanges(paymentResponse.result.meta)
  //   assert.deepStrictEqual(result, expected)
  // })

  // it('Redeem then issue USD', function () {
  //   const paymentResponse = loadFixture('payment-iou-redeem-then-issue.json')
  //   const result = getBalanceChanges(paymentResponse.result.meta)
  //   assert.deepStrictEqual(result, expected)
  // })

  // it('Multipath USD payment', function () {
  //   const paymentResponse = loadFixture('payment-iou-multipath.json')
  //   const result = getBalanceChanges(paymentResponse.result.meta)
  //   assert.deepStrictEqual(result, expected)
  // })
})
