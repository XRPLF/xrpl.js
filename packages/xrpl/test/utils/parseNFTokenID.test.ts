import { assert } from 'chai'

import { parseNFTokenID } from '../../src'
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

  it('decode a valid NFTokenID with big taxon', function () {
    const nftokenID =
      '000000005EC8BC31F0415E5DD4A8AAAC3718249F8F27323C2EEE87B80000001E'
    const result = parseNFTokenID(nftokenID)
    const expected = {
      NFTokenID: nftokenID,
      Flags: 0,
      TransferFee: 0,
      Issuer: 'r9ewzMXVRAD9CjZQ6LTQ4P21vUUucDuqd4',
      Taxon: 2147483649,
      Sequence: 30,
    }
    assertResultMatch(result, expected)
  })

  it('decode a valid NFTokenID with big sequence', function () {
    const nftokenID =
      '00081388BE9E48FA0E6C95A3E970EB9503E3D3967E8DF95041FED82604D933AB'
    const result = parseNFTokenID(nftokenID)
    const expected = {
      NFTokenID: nftokenID,
      Flags: 8,
      TransferFee: 5000,
      Issuer: 'rJ4urHeGPr69TsC9TY9u8N965AdD7S3XEY',
      Taxon: 96,
      Sequence: 81343403,
    }
    assertResultMatch(result, expected)
  })

  it('fail when given invalid NFTokenID', function () {
    assert.throws(() => {
      parseNFTokenID('ABCD')
    })
  })
})
