import { assert } from 'chai'

import { ValidationError } from '../../src'
import { areAmountsEqual } from '../../src/models/transactions/common'

/**
 * Models Transactions Common tests.
 *
 * Provides tests for common functionality across all transaction models.
 */
describe('Models Transactions Common', function () {
  const xrpAmount1 = '314.15'
  const xrpAmount2 = '271.82'
  const issuedCurrencyAmount1 = {
    currency: 'USD',
    issuer: 'rIssuer1',
    value: '100',
  }
  const issuedCurrencyAmount2 = {
    currency: 'USD',
    issuer: 'rIssuer2',
    value: '100',
  }
  const mptAmount1 = { mpt_issuance_id: 'abc123', value: '10' }
  const mptAmount2 = { mpt_issuance_id: 'qwe321', value: '11' }

  describe('areAmountsEqual', function () {
    it('returns false for mismatched types', function () {
      assert.isFalse(areAmountsEqual(xrpAmount1, issuedCurrencyAmount1))
    })

    it('returns true for equal string amounts', function () {
      assert.isTrue(areAmountsEqual(xrpAmount1, xrpAmount1))
    })

    it('returns false for unequal string amounts', function () {
      assert.isFalse(areAmountsEqual(xrpAmount1, xrpAmount2))
    })

    it('returns true for equal issued currency amounts', function () {
      assert.isTrue(
        areAmountsEqual(issuedCurrencyAmount1, issuedCurrencyAmount1),
      )
    })

    it('return true for equal issue currency amount with different object references', function () {
      assert.isTrue(
        areAmountsEqual(issuedCurrencyAmount1, { ...issuedCurrencyAmount1 }),
      )
    })

    it('returns false for issued currency with different issuer', function () {
      assert.isFalse(
        areAmountsEqual(issuedCurrencyAmount1, issuedCurrencyAmount2),
      )
    })

    it('returns false for issued currency with different values', function () {
      assert.isFalse(
        areAmountsEqual(issuedCurrencyAmount1, {
          ...issuedCurrencyAmount1,
          value: '200',
        }),
      )
    })

    it('returns false for issued currency with different currencies', function () {
      assert.isFalse(
        areAmountsEqual(issuedCurrencyAmount1, {
          ...issuedCurrencyAmount1,
          currency: 'EUR',
        }),
      )
    })

    it('returns true for equal MPT amounts', function () {
      assert.isTrue(areAmountsEqual(mptAmount1, mptAmount1))
    })

    it('returns true for equal MPT amounts with different object references', function () {
      assert.isTrue(areAmountsEqual(mptAmount1, { ...mptAmount1 }))
    })

    it('returns false for MPT amounts with different issuance ID', function () {
      assert.isFalse(areAmountsEqual(mptAmount1, mptAmount2))
    })

    it('returns false for MPT amounts with different value', function () {
      assert.isFalse(
        areAmountsEqual(mptAmount1, { ...mptAmount1, value: '20' }),
      )
    })

    it('throws error when one amount is invalid', function () {
      const invalidAmount2 = null
      assert.throws(
        () => areAmountsEqual(xrpAmount1, invalidAmount2),
        ValidationError,
        'Invalid amount',
      )
    })

    it('throws error when both amounts are invalid', function () {
      const invalidAmount1 = { issuer: 'rIssuer1', value: '100' }
      const invalidAmount2 = { currency: 'USD', issuer: 'rIssuer1' }

      assert.throws(
        () => areAmountsEqual(invalidAmount1, invalidAmount2),
        ValidationError,
        'Invalid amount',
      )
    })
  })
})
