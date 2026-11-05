import { assert } from 'chai'

import { isSameAsset } from '../../../src/models/utils/amount'

const ISSUER = 'rEb8TK3gBgk5auZkwc6sHnwrGVJH8DuaLh'
const OTHER_ISSUER = 'rN7n7otQDd6FczFgLdSqtcsAUxDkw6fzRH'
const USD_HEX = '0000000000000000000000005553440000000000'
const MPT_ID = '00000001A407AF5856CCF3C42619DAA925813FC955C72983'

describe('isSameAsset', function () {
  it('treats a 3-character code and its 40-hex form as the same asset', function () {
    assert.isTrue(
      isSameAsset(
        { currency: 'USD', issuer: ISSUER, value: '1' },
        { currency: USD_HEX, issuer: ISSUER, value: '2' },
      ),
    )
    assert.isTrue(
      isSameAsset(
        { currency: USD_HEX.toLowerCase(), issuer: ISSUER, value: '1' },
        { currency: 'USD', issuer: ISSUER, value: '2' },
      ),
    )
  })

  it('treats the same code with different issuers as different assets', function () {
    assert.isFalse(
      isSameAsset(
        { currency: 'USD', issuer: ISSUER, value: '1' },
        { currency: 'USD', issuer: OTHER_ISSUER, value: '1' },
      ),
    )
  })

  it('treats different codes as different assets', function () {
    assert.isFalse(
      isSameAsset(
        { currency: 'USD', issuer: ISSUER, value: '1' },
        { currency: 'EUR', issuer: ISSUER, value: '1' },
      ),
    )
  })

  it('treats XRP and XRP as the same asset', function () {
    assert.isTrue(isSameAsset('10', '20'))
  })

  it('treats XRP and an issued currency as different assets', function () {
    assert.isFalse(
      isSameAsset('10', { currency: 'USD', issuer: ISSUER, value: '1' }),
    )
    assert.isFalse(
      isSameAsset({ currency: 'USD', issuer: ISSUER, value: '1' }, '10'),
    )
  })

  it('compares MPTs by mpt_issuance_id', function () {
    assert.isTrue(
      isSameAsset(
        { mpt_issuance_id: MPT_ID, value: '1' },
        { mpt_issuance_id: MPT_ID, value: '2' },
      ),
    )
    assert.isFalse(
      isSameAsset(
        { mpt_issuance_id: MPT_ID, value: '1' },
        { mpt_issuance_id: MPT_ID.replace('A407', 'B407'), value: '1' },
      ),
    )
    assert.isFalse(
      isSameAsset(
        { mpt_issuance_id: MPT_ID, value: '1' },
        { currency: 'USD', issuer: ISSUER, value: '1' },
      ),
    )
  })
})
