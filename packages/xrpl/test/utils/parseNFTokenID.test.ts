import { assert } from 'chai'
import { parseNFTokenID } from 'xrpl-local'

import { assertResultMatch } from '../testUtils'

describe('parseNFTokenID', function () {
  it('decode a valid NFTokenID', function () {
    const nftokenID =
      '000B0539C35B55AA096BA6D87A6E6C965A6534150DC56E5E12C5D09E0000000C'
    const result = parseNFTokenID(nftokenID)
    const expected = {
      NFTokenID: nftokenID,
      Flags: 11,
      TransferFee: 1337,
      Issuer: 'rJoxBSzpXhPtAuqFmqxQtGKjA13jUJWthE',
      Taxon: 1337,
      Sequence: 12,
    }
    assertResultMatch(result, expected)
  })

  it('fail when given invalid NFTokenID', function () {
    assert.throws(() => {
      parseNFTokenID('ABCD')
    })
  })
})
