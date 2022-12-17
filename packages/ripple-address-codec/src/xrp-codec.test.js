const api = require('./xrp-codec')

function toHex(bytes) {
  return Buffer.from(bytes).toString('hex').toUpperCase()
}

function toBytes(hex) {
  return Buffer.from(hex, 'hex')
}

/**
 * Create a test case for encoding data and a test case for decoding data.
 *
 * @param encoder Encoder function to test
 * @param decoder Decoder function to test
 * @param base58 Base58-encoded string to decode
 * @param hex Hexadecimal representation of expected decoded data
 */
function makeEncodeDecodeTest(encoder, decoder, base58, hex) {
  test(`can translate between ${hex} and ${base58}`, function () {
    const actual = encoder(toBytes(hex))
    expect(actual).toBe(base58)
  })
  test(`can translate between ${base58} and ${hex})`, function () {
    const buf = decoder(base58)
    expect(toHex(buf)).toBe(hex)
  })
}

makeEncodeDecodeTest(
  api.encodeAccountID,
  api.decodeAccountID,
  'rJrRMgiRgrU6hDF4pgu5DXQdWyPbY35ErN',
  'BA8E78626EE42C41B46D46C3048DF3A1C3C87072',
)

makeEncodeDecodeTest(
  api.encodeNodePublic,
  api.decodeNodePublic,
  'n9MXXueo837zYH36DvMc13BwHcqtfAWNJY5czWVbp7uYTj7x17TH',
  '0388E5BA87A000CB807240DF8C848EB0B5FFA5C8E5A521BC8E105C0F0A44217828',
)

makeEncodeDecodeTest(
  api.encodeAccountPublic,
  api.decodeAccountPublic,
  'aB44YfzW24VDEJQ2UuLPV2PvqcPCSoLnL7y5M1EzhdW4LnK5xMS3',
  '023693F15967AE357D0327974AD46FE3C127113B1110D6044FD41E723689F81CC6',
)

test('can decode arbitrary seeds', function () {
  const decoded = api.decodeSeed('sEdTM1uX8pu2do5XvTnutH6HsouMaM2')
  expect(toHex(decoded.bytes)).toBe('4C3A1D213FBDFB14C7C28D609469B341')
  expect(decoded.type).toBe('ed25519')

  const decoded2 = api.decodeSeed('sn259rEFXrQrWyx3Q7XneWcwV6dfL')
  expect(toHex(decoded2.bytes)).toBe('CF2DE378FBDD7E2EE87D486DFB5A7BFF')
  expect(decoded2.type).toBe('secp256k1')
})

test('can pass a type as second arg to encodeSeed', function () {
  const edSeed = 'sEdTM1uX8pu2do5XvTnutH6HsouMaM2'
  const decoded = api.decodeSeed(edSeed)
  const type = 'ed25519'
  expect(toHex(decoded.bytes)).toBe('4C3A1D213FBDFB14C7C28D609469B341')
  expect(decoded.type).toBe(type)
  expect(api.encodeSeed(decoded.bytes, type)).toBe(edSeed)
})

test('isValidClassicAddress - secp256k1 address valid', function () {
  expect(api.isValidClassicAddress('rU6K7V3Po4snVhBBaU29sesqs2qTQJWDw1')).toBe(
    true,
  )
})

test('isValidClassicAddress - ed25519 address valid', function () {
  expect(api.isValidClassicAddress('rLUEXYuLiQptky37CqLcm9USQpPiz5rkpD')).toBe(
    true,
  )
})

test('isValidClassicAddress - invalid', function () {
  expect(api.isValidClassicAddress('rU6K7V3Po4snVhBBaU29sesqs2qTQJWDw2')).toBe(
    false,
  )
})

test('isValidClassicAddress - empty', function () {
  expect(api.isValidClassicAddress('')).toBe(false)
})

describe('encodeSeed', function () {
  it('encodes a secp256k1 seed', function () {
    const result = api.encodeSeed(
      Buffer.from('CF2DE378FBDD7E2EE87D486DFB5A7BFF', 'hex'),
      'secp256k1',
    )
    expect(result).toBe('sn259rEFXrQrWyx3Q7XneWcwV6dfL')
  })

  it('encodes low secp256k1 seed', function () {
    const result = api.encodeSeed(
      Buffer.from('00000000000000000000000000000000', 'hex'),
      'secp256k1',
    )
    expect(result).toBe('sp6JS7f14BuwFY8Mw6bTtLKWauoUs')
  })

  it('encodes high secp256k1 seed', function () {
    const result = api.encodeSeed(
      Buffer.from('FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF', 'hex'),
      'secp256k1',
    )
    expect(result).toBe('saGwBRReqUNKuWNLpUAq8i8NkXEPN')
  })

  it('encodes an ed25519 seed', function () {
    const result = api.encodeSeed(
      Buffer.from('4C3A1D213FBDFB14C7C28D609469B341', 'hex'),
      'ed25519',
    )
    expect(result).toBe('sEdTM1uX8pu2do5XvTnutH6HsouMaM2')
  })

  it('encodes low ed25519 seed', function () {
    const result = api.encodeSeed(
      Buffer.from('00000000000000000000000000000000', 'hex'),
      'ed25519',
    )
    expect(result).toBe('sEdSJHS4oiAdz7w2X2ni1gFiqtbJHqE')
  })

  it('encodes high ed25519 seed', function () {
    const result = api.encodeSeed(
      Buffer.from('FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF', 'hex'),
      'ed25519',
    )
    expect(result).toBe('sEdV19BLfeQeKdEXyYA4NhjPJe6XBfG')
  })

  test('attempting to encode a seed with less than 16 bytes of entropy throws', function () {
    expect(() => {
      api.encodeSeed(
        Buffer.from('CF2DE378FBDD7E2EE87D486DFB5A7B', 'hex'),
        'secp256k1',
      )
    }).toThrow('entropy must have length 16')
  })

  test('attempting to encode a seed with more than 16 bytes of entropy throws', function () {
    expect(() => {
      api.encodeSeed(
        Buffer.from('CF2DE378FBDD7E2EE87D486DFB5A7BFFFF', 'hex'),
        'secp256k1',
      )
    }).toThrow('entropy must have length 16')
  })
})

describe('decodeSeed', function () {
  it('can decode an Ed25519 seed', function () {
    const decoded = api.decodeSeed('sEdTM1uX8pu2do5XvTnutH6HsouMaM2')
    expect(toHex(decoded.bytes)).toBe('4C3A1D213FBDFB14C7C28D609469B341')
    expect(decoded.type).toBe('ed25519')
  })

  it('can decode a secp256k1 seed', function () {
    const decoded = api.decodeSeed('sn259rEFXrQrWyx3Q7XneWcwV6dfL')
    expect(toHex(decoded.bytes)).toBe('CF2DE378FBDD7E2EE87D486DFB5A7BFF')
    expect(decoded.type).toBe('secp256k1')
  })
})

describe('encodeAccountID', function () {
  it('can encode an AccountID', function () {
    const encoded = api.encodeAccountID(
      Buffer.from('BA8E78626EE42C41B46D46C3048DF3A1C3C87072', 'hex'),
    )
    expect(encoded).toBe('rJrRMgiRgrU6hDF4pgu5DXQdWyPbY35ErN')
  })

  test('unexpected length should throw', function () {
    expect(() => {
      api.encodeAccountID(Buffer.from('ABCDEF', 'hex'))
    }).toThrow(
      'unexpected_payload_length: bytes.length does not match expectedLength',
    )
  })
})

describe('decodeNodePublic', function () {
  it('can decode a NodePublic', function () {
    const decoded = api.decodeNodePublic(
      'n9MXXueo837zYH36DvMc13BwHcqtfAWNJY5czWVbp7uYTj7x17TH',
    )
    expect(toHex(decoded)).toBe(
      '0388E5BA87A000CB807240DF8C848EB0B5FFA5C8E5A521BC8E105C0F0A44217828',
    )
  })
})

test('encodes 123456789 with version byte of 0', () => {
  expect(
    api.codec.encode(Buffer.from('123456789'), {
      versions: [0],
      expectedLength: 9,
    }),
  ).toBe('rnaC7gW34M77Kneb78s')
})

test('multiple versions with no expected length should throw', () => {
  expect(() => {
    api.codec.decode('rnaC7gW34M77Kneb78s', {
      versions: [0, 1],
    })
  }).toThrow(
    'expectedLength is required because there are >= 2 possible versions',
  )
})

test('attempting to decode data with length < 5 should throw', () => {
  expect(() => {
    api.codec.decode('1234', {
      versions: [0],
    })
  }).toThrow('invalid_input_size: decoded data must have length >= 5')
})

test('attempting to decode data with unexpected version should throw', () => {
  expect(() => {
    api.codec.decode('rnaC7gW34M77Kneb78s', {
      versions: [2],
    })
  }).toThrow(
    'version_invalid: version bytes do not match any of the provided version(s)',
  )
})

test('invalid checksum should throw', () => {
  expect(() => {
    api.codec.decode('123456789', {
      versions: [0, 1],
    })
  }).toThrow('checksum_invalid')
})

test('empty payload should throw', () => {
  expect(() => {
    api.codec.decode('', {
      versions: [0, 1],
    })
  }).toThrow('invalid_input_size: decoded data must have length >= 5')
})

test('decode data', () => {
  expect(
    api.codec.decode('rnaC7gW34M77Kneb78s', {
      versions: [0],
    }),
  ).toStrictEqual({
    version: [0],
    bytes: Buffer.from('123456789'),
    type: null,
  })
})

test('decode data with expected length', function () {
  expect(
    api.codec.decode('rnaC7gW34M77Kneb78s', {
      versions: [0],
      expectedLength: 9,
    }),
  ).toStrictEqual({
    version: [0],
    bytes: Buffer.from('123456789'),
    type: null,
  })
})

test('decode data with wrong expected length should throw', function () {
  expect(() => {
    api.codec.decode('rnaC7gW34M77Kneb78s', {
      versions: [0],
      expectedLength: 8,
    })
  }).toThrow(
    'version_invalid: version bytes do not match any of the provided version(s)',
  )
  expect(() => {
    api.codec.decode('rnaC7gW34M77Kneb78s', {
      versions: [0],
      expectedLength: 10,
    })
  }).toThrow(
    'version_invalid: version bytes do not match any of the provided version(s)',
  )
})
