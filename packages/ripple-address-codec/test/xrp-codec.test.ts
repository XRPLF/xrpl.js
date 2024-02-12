import { bytesToHex, hexToBytes, stringToHex } from '@xrplf/isomorphic/utils'

import {
  codec,
  decodeAccountID,
  decodeAccountPublic,
  decodeNodePublic,
  decodeSeed,
  encodeAccountID,
  encodeAccountPublic,
  encodeNodePublic,
  encodeSeed,
  isValidClassicAddress,
} from '../src'

function stringToBytes(str: string): Uint8Array {
  return hexToBytes(stringToHex(str))
}

/**
 * Create a test case for encoding data and a test case for decoding data.
 *
 * @param encoder - Encoder function to test
 * @param decoder - Decoder function to test
 * @param base58 - Base58-encoded string to decode
 * @param hex - Hexadecimal representation of expected decoded data
 */
// eslint-disable-next-line max-params -- needs them
function makeEncodeDecodeTest(
  encoder: (val: Uint8Array) => string,
  decoder: (val: string) => Uint8Array,
  base58: string,
  hex: string,
): void {
  it(`can translate between ${hex} and ${base58}`, function () {
    const actual = encoder(hexToBytes(hex))
    expect(actual).toBe(base58)
  })
  it(`can translate between ${base58} and ${hex})`, function () {
    const buf = decoder(base58)
    expect(bytesToHex(buf)).toBe(hex)
  })
}

makeEncodeDecodeTest(
  encodeAccountID,
  decodeAccountID,
  'rJrRMgiRgrU6hDF4pgu5DXQdWyPbY35ErN',
  'BA8E78626EE42C41B46D46C3048DF3A1C3C87072',
)

makeEncodeDecodeTest(
  encodeNodePublic,
  decodeNodePublic,
  'n9MXXueo837zYH36DvMc13BwHcqtfAWNJY5czWVbp7uYTj7x17TH',
  '0388E5BA87A000CB807240DF8C848EB0B5FFA5C8E5A521BC8E105C0F0A44217828',
)

makeEncodeDecodeTest(
  encodeAccountPublic,
  decodeAccountPublic,
  'aB44YfzW24VDEJQ2UuLPV2PvqcPCSoLnL7y5M1EzhdW4LnK5xMS3',
  '023693F15967AE357D0327974AD46FE3C127113B1110D6044FD41E723689F81CC6',
)

it('can decode arbitrary seeds', function () {
  const decoded = decodeSeed('sEdTM1uX8pu2do5XvTnutH6HsouMaM2')
  expect(bytesToHex(decoded.bytes)).toBe('4C3A1D213FBDFB14C7C28D609469B341')
  expect(decoded.type).toBe('ed25519')

  const decoded2 = decodeSeed('sn259rEFXrQrWyx3Q7XneWcwV6dfL')
  expect(bytesToHex(decoded2.bytes)).toBe('CF2DE378FBDD7E2EE87D486DFB5A7BFF')
  expect(decoded2.type).toBe('secp256k1')
})

it('can pass a type as second arg to encodeSeed', function () {
  const edSeed = 'sEdTM1uX8pu2do5XvTnutH6HsouMaM2'
  const decoded = decodeSeed(edSeed)
  const type = 'ed25519'
  expect(bytesToHex(decoded.bytes)).toBe('4C3A1D213FBDFB14C7C28D609469B341')
  expect(decoded.type).toBe(type)
  expect(encodeSeed(decoded.bytes, type)).toBe(edSeed)
})

it('isValidClassicAddress - secp256k1 address valid', function () {
  expect(isValidClassicAddress('rU6K7V3Po4snVhBBaU29sesqs2qTQJWDw1')).toBe(true)
})

it('isValidClassicAddress - ed25519 address valid', function () {
  expect(isValidClassicAddress('rLUEXYuLiQptky37CqLcm9USQpPiz5rkpD')).toBe(true)
})

it('isValidClassicAddress - invalid', function () {
  expect(isValidClassicAddress('rU6K7V3Po4snVhBBaU29sesqs2qTQJWDw2')).toBe(
    false,
  )
})

it('isValidClassicAddress - empty', function () {
  expect(isValidClassicAddress('')).toBe(false)
})

describe('encodeSeed', function () {
  it('encodes a secp256k1 seed', function () {
    const result = encodeSeed(
      hexToBytes('CF2DE378FBDD7E2EE87D486DFB5A7BFF'),
      'secp256k1',
    )
    expect(result).toBe('sn259rEFXrQrWyx3Q7XneWcwV6dfL')
  })

  it('encodes low secp256k1 seed', function () {
    const result = encodeSeed(
      hexToBytes('00000000000000000000000000000000'),
      'secp256k1',
    )
    expect(result).toBe('sp6JS7f14BuwFY8Mw6bTtLKWauoUs')
  })

  it('encodes high secp256k1 seed', function () {
    const result = encodeSeed(
      hexToBytes('FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF'),
      'secp256k1',
    )
    expect(result).toBe('saGwBRReqUNKuWNLpUAq8i8NkXEPN')
  })

  it('encodes an ed25519 seed', function () {
    const result = encodeSeed(
      hexToBytes('4C3A1D213FBDFB14C7C28D609469B341'),
      'ed25519',
    )
    expect(result).toBe('sEdTM1uX8pu2do5XvTnutH6HsouMaM2')
  })

  it('encodes low ed25519 seed', function () {
    const result = encodeSeed(
      hexToBytes('00000000000000000000000000000000'),
      'ed25519',
    )
    expect(result).toBe('sEdSJHS4oiAdz7w2X2ni1gFiqtbJHqE')
  })

  it('encodes high ed25519 seed', function () {
    const result = encodeSeed(
      hexToBytes('FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF'),
      'ed25519',
    )
    expect(result).toBe('sEdV19BLfeQeKdEXyYA4NhjPJe6XBfG')
  })

  it('attempting to encode a seed with less than 16 bytes of entropy throws', function () {
    expect(() => {
      encodeSeed(hexToBytes('CF2DE378FBDD7E2EE87D486DFB5A7B'), 'secp256k1')
    }).toThrow(new Error('entropy must have length 16'))
  })

  it('attempting to encode a seed with more than 16 bytes of entropy throws', function () {
    expect(() => {
      encodeSeed(hexToBytes('CF2DE378FBDD7E2EE87D486DFB5A7BFFFF'), 'secp256k1')
    }).toThrow(new Error('entropy must have length 16'))
  })
})

describe('decodeSeed', function () {
  it('can decode an Ed25519 seed', function () {
    const decoded = decodeSeed('sEdTM1uX8pu2do5XvTnutH6HsouMaM2')
    expect(bytesToHex(decoded.bytes)).toBe('4C3A1D213FBDFB14C7C28D609469B341')
    expect(decoded.type).toBe('ed25519')
  })

  it('can decode a secp256k1 seed', function () {
    const decoded = decodeSeed('sn259rEFXrQrWyx3Q7XneWcwV6dfL')
    expect(bytesToHex(decoded.bytes)).toBe('CF2DE378FBDD7E2EE87D486DFB5A7BFF')
    expect(decoded.type).toBe('secp256k1')
  })
})

describe('encodeAccountID', function () {
  it('can encode an AccountID', function () {
    const encoded = encodeAccountID(
      hexToBytes('BA8E78626EE42C41B46D46C3048DF3A1C3C87072'),
    )
    expect(encoded).toBe('rJrRMgiRgrU6hDF4pgu5DXQdWyPbY35ErN')
  })

  it('unexpected length should throw', function () {
    expect(() => {
      encodeAccountID(hexToBytes('ABCDEF'))
    }).toThrow(
      new Error(
        'unexpected_payload_length: bytes.length does not match expectedLength. Ensure that the bytes are a Uint8Array.',
      ),
    )
  })
})

describe('decodeNodePublic', function () {
  it('can decode a NodePublic', function () {
    const decoded = decodeNodePublic(
      'n9MXXueo837zYH36DvMc13BwHcqtfAWNJY5czWVbp7uYTj7x17TH',
    )
    expect(bytesToHex(decoded)).toBe(
      '0388E5BA87A000CB807240DF8C848EB0B5FFA5C8E5A521BC8E105C0F0A44217828',
    )
  })
})

it('encodes 123456789 with version byte of 0', () => {
  expect(
    codec.encode(stringToBytes('123456789'), {
      versions: [0],
      expectedLength: 9,
    }),
  ).toBe('rnaC7gW34M77Kneb78s')
})

it('multiple versions with no expected length should throw', () => {
  expect(() => {
    codec.decode('rnaC7gW34M77Kneb78s', {
      versions: [0, 1],
    })
  }).toThrow(
    new Error(
      'expectedLength is required because there are >= 2 possible versions',
    ),
  )
})

it('attempting to decode data with length < 5 should throw', () => {
  expect(() => {
    codec.decode('1234', {
      versions: [0],
    })
  }).toThrow(
    new Error('invalid_input_size: decoded data must have length >= 5'),
  )
})

it('attempting to decode data with unexpected version should throw', () => {
  expect(() => {
    codec.decode('rnaC7gW34M77Kneb78s', {
      versions: [2],
    })
  }).toThrow(
    new Error(
      'version_invalid: version bytes do not match any of the provided version(s)',
    ),
  )
})

it('invalid checksum should throw', () => {
  expect(() => {
    codec.decode('123456789', {
      versions: [0, 1],
    })
  }).toThrow(new Error('checksum_invalid'))
})

it('empty payload should throw', () => {
  expect(() => {
    codec.decode('', {
      versions: [0, 1],
    })
  }).toThrow(
    new Error('invalid_input_size: decoded data must have length >= 5'),
  )
})

it('decode data', () => {
  expect(
    codec.decode('rnaC7gW34M77Kneb78s', {
      versions: [0],
    }),
  ).toEqual({
    version: [0],
    bytes: stringToBytes('123456789'),
    type: null,
  })
})

it('decode data with expected length', function () {
  expect(
    codec.decode('rnaC7gW34M77Kneb78s', {
      versions: [0],
      expectedLength: 9,
    }),
  ).toEqual({
    version: [0],
    bytes: stringToBytes('123456789'),
    type: null,
  })
})

it('decode data with wrong expected length should throw', function () {
  expect(() => {
    codec.decode('rnaC7gW34M77Kneb78s', {
      versions: [0],
      expectedLength: 8,
    })
  }).toThrow(
    new Error(
      'version_invalid: version bytes do not match any of the provided version(s)',
    ),
  )
  expect(() => {
    codec.decode('rnaC7gW34M77Kneb78s', {
      versions: [0],
      expectedLength: 10,
    })
  }).toThrow(
    new Error(
      'version_invalid: version bytes do not match any of the provided version(s)',
    ),
  )
})
