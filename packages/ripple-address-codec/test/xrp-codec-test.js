/* eslint-disable no-unused-expressions/no-unused-expressions */

'use strict'

const assert = require('assert')
const api = require('../dist/xrp-codec')

function toHex(bytes) {
  return new Buffer(bytes).toString('hex').toUpperCase()
}

function toBytes(hex) {
  return new Buffer(hex, 'hex').toJSON().data
}

describe('ripple-address-codec', function() {

  describe('encodeSeed', function() {

    it('encodes a secp256k1 seed', function() {
      const result = api.encodeSeed(toBytes('CF2DE378FBDD7E2EE87D486DFB5A7BFF'), 'secp256k1')
      assert.equal(result, 'sn259rEFXrQrWyx3Q7XneWcwV6dfL')
    })

    it('encodes low secp256k1 seed', function() {
      const result = api.encodeSeed(toBytes('00000000000000000000000000000000'), 'secp256k1')
      assert.equal(result, 'sp6JS7f14BuwFY8Mw6bTtLKWauoUs')
    })

    it('encodes high secp256k1 seed', function() {
      const result = api.encodeSeed(toBytes('FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF'), 'secp256k1')
      assert.equal(result, 'saGwBRReqUNKuWNLpUAq8i8NkXEPN')
    })

    it('encodes an ed25519 seed', function() {
      const result = api.encodeSeed(toBytes('4C3A1D213FBDFB14C7C28D609469B341'), 'ed25519')
      assert.equal(result, 'sEdTM1uX8pu2do5XvTnutH6HsouMaM2')
    })

    it('encodes low ed25519 seed', function() {
      const result = api.encodeSeed(toBytes('00000000000000000000000000000000'), 'ed25519')
      assert.equal(result, 'sEdSJHS4oiAdz7w2X2ni1gFiqtbJHqE')
    })

    it('encodes high ed25519 seed', function() {
      const result = api.encodeSeed(toBytes('FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF'), 'ed25519')
      assert.equal(result, 'sEdV19BLfeQeKdEXyYA4NhjPJe6XBfG')
    })
  })

  describe('decodeSeed', function() {

    it('can decode an Ed25519 seed', function() {
      const decoded = api.decodeSeed('sEdTM1uX8pu2do5XvTnutH6HsouMaM2')
      assert.equal(toHex(decoded.bytes), '4C3A1D213FBDFB14C7C28D609469B341')
      assert.equal(decoded.type, 'ed25519')
    })

    it('can decode a secp256k1 seed', function() {
      const decoded = api.decodeSeed('sn259rEFXrQrWyx3Q7XneWcwV6dfL')
      assert.equal(toHex(decoded.bytes), 'CF2DE378FBDD7E2EE87D486DFB5A7BFF')
      assert.equal(decoded.type, 'secp256k1')
    })
  })

  describe('encodeAccountID', function() {

    it('can encode an AccountID', function() {
      const encoded = api.encodeAccountID(toBytes('BA8E78626EE42C41B46D46C3048DF3A1C3C87072'))
      assert.equal(encoded, 'rJrRMgiRgrU6hDF4pgu5DXQdWyPbY35ErN')
    })
  })

  describe('decodeNodePublic', function() {

    it('can decode a NodePublic', function() {
      const decoded = api.decodeNodePublic('n9MXXueo837zYH36DvMc13BwHcqtfAWNJY5czWVbp7uYTj7x17TH')
      assert.equal(toHex(decoded), '0388E5BA87A000CB807240DF8C848EB0B5FFA5C8E5A521BC8E105C0F0A44217828')
    })
  })
})
