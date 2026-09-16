import { assert } from 'chai'

import { isTesSuccess } from '../../src'

describe('isTesSuccess', function () {
  it('returns true for tesSUCCESS', function () {
    assert.isTrue(isTesSuccess('tesSUCCESS'))
  })

  it('returns false for a tec code', function () {
    assert.isFalse(isTesSuccess('tecUNFUNDED_PAYMENT'))
  })

  it('returns false for tem, tef, tel, and ter codes', function () {
    assert.isFalse(isTesSuccess('temBAD_AMOUNT'))
    assert.isFalse(isTesSuccess('tefPAST_SEQ'))
    assert.isFalse(isTesSuccess('telINSUF_FEE_P'))
    assert.isFalse(isTesSuccess('terQUEUED'))
  })
})
