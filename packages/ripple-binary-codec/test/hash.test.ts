import {
  Hash128,
  Hash160,
  Hash192,
  Hash256,
  AccountID,
  Currency,
} from '../src/types'

describe('Hash128', function () {
  it('has a static width member', function () {
    expect(Hash128.width).toBe(16)
  })
  it('can be unset', function () {
    const h1 = Hash128.from('')
    expect(h1.toJSON()).toBe('')
  })
  it('can be compared against another', function () {
    const h1 = Hash128.from('100000000000000000000000000000000')
    const h2 = Hash128.from('200000000000000000000000000000000')
    const h3 = Hash128.from('000000000000000000000000000000003')
    expect(h1.lt(h2)).toBe(true)
    expect(h3.lt(h2)).toBe(true)
    expect(h2.gt(h1)).toBe(true)
    expect(h1.gt(h3)).toBe(true)
  })
  it('throws when constructed from invalid hash length', () => {
    expect(() => Hash128.from('1000000000000000000000000000000')).toThrow(
      new Error('Invalid Hash length 15'),
    )
    expect(() => Hash128.from('10000000000000000000000000000000000')).toThrow(
      new Error('Invalid Hash length 17'),
    )
  })
})
describe('Hash160', function () {
  it('has a static width member', function () {
    expect(Hash160.width).toBe(20)
  })
  it('inherited by subclasses', function () {
    expect(AccountID.width).toBe(20)
    expect(Currency.width).toBe(20)
  })
  it('can be compared against another', function () {
    const h1 = Hash160.from('1000000000000000000000000000000000000000')
    const h2 = Hash160.from('2000000000000000000000000000000000000000')
    const h3 = Hash160.from('0000000000000000000000000000000000000003')
    expect(h1.lt(h2)).toBe(true)
    expect(h3.lt(h2)).toBe(true)
  })
  it('throws when constructed from invalid hash length', () => {
    expect(() =>
      Hash160.from('10000000000000000000000000000000000000'),
    ).toThrow(new Error('Invalid Hash length 19'))
    expect(() =>
      Hash160.from('100000000000000000000000000000000000000000'),
    ).toThrow(new Error('Invalid Hash length 21'))
  })
})

describe('Hash192', function () {
  it('has a static width member', function () {
    expect(Hash192.width).toBe(24)
  })
  it('has a ZERO_192 member', function () {
    expect(Hash192.ZERO_192.toJSON()).toBe(
      '000000000000000000000000000000000000000000000000',
    )
  })
  it('can be compared against another', function () {
    const h1 = Hash192.from('100000000000000000000000000000000000000000000000')
    const h2 = Hash192.from('200000000000000000000000000000000000000000000000')
    const h3 = Hash192.from('000000000000000000000000000000000000000000000003')
    expect(h1.lt(h2)).toBe(true)
    expect(h3.lt(h2)).toBe(true)
  })

  it('throws when constructed from invalid hash length', () => {
    expect(() =>
      Hash192.from('10000000000000000000000000000000000000000000000'),
    ).toThrow(new Error('Invalid Hash length 23'))
    expect(() =>
      Hash192.from('10000000000000000000000000000000000000000000000000'),
    ).toThrow(new Error('Invalid Hash length 25'))
  })
})

describe('Hash256', function () {
  it('has a static width member', function () {
    expect(Hash256.width).toBe(32)
  })
  it('has a ZERO_256 member', function () {
    expect(Hash256.ZERO_256.toJSON()).toBe(
      '0000000000000000000000000000000000000000000000000000000000000000',
    )
  })
  it('supports getting the nibblet values at given positions', function () {
    const h = Hash256.from(
      '1359BD0000000000000000000000000000000000000000000000000000000000',
    )
    expect(h.nibblet(0)).toBe(0x1)
    expect(h.nibblet(1)).toBe(0x3)
    expect(h.nibblet(2)).toBe(0x5)
    expect(h.nibblet(3)).toBe(0x9)
    expect(h.nibblet(4)).toBe(0x0b)
    expect(h.nibblet(5)).toBe(0xd)
  })
})

describe('Currency', function () {
  it('Decoding allows dodgy XRP without throwing', function () {
    const currencyCode = '0000000000000000000000005852500000000000'
    expect(Currency.from(currencyCode).toJSON()).toBe(currencyCode)
  })
  it('Currency code with lowercase letters decodes to ISO code', () => {
    expect(Currency.from('xRp').toJSON()).toBe('xRp')
  })
  it('Currency codes with symbols decodes to ISO code', () => {
    expect(Currency.from('x|p').toJSON()).toBe('x|p')
  })
  it('Currency code with non-standard symbols decodes to hex', () => {
    expect(Currency.from(':::').toJSON()).toBe(
      '0000000000000000000000003A3A3A0000000000',
    )
  })
  it('Currency codes can be exclusively standard symbols', () => {
    expect(Currency.from('![]').toJSON()).toBe('![]')
  })
  it('Currency codes with uppercase and 0-9 decode to ISO codes', () => {
    expect(Currency.from('X8P').toJSON()).toBe('X8P')
    expect(Currency.from('USD').toJSON()).toBe('USD')
  })

  it('Currency codes with no contiguous zeroes in first 96 type code & reserved bits', function () {
    expect(
      Currency.from('0000000023410000000000005852520000000000').iso(),
    ).toBe(null)
  })

  it('Currency codes with no contiguous zeroes in last 40 reserved bits', function () {
    expect(
      Currency.from('0000000000000000000000005852527570656500').iso(),
    ).toBe(null)
  })

  it('can be constructed from a Uint8Array', function () {
    const xrp = new Currency(new Uint8Array(20))
    expect(xrp.iso()).toBe('XRP')
  })
  it('Can handle non-standard currency codes', () => {
    const currency = '015841551A748AD2C1F76FF6ECB0CCCD00000000'
    expect(Currency.from(currency).toJSON()).toBe(currency)
  })

  it('Can handle other non-standard currency codes', () => {
    const currency = '0000000000414C6F676F30330000000000000000'
    expect(Currency.from(currency).toJSON()).toBe(currency)
  })

  it('throws on invalid reprs', function () {
    // @ts-expect-error -- invalid type check
    expect(() => Currency.from(new Uint8Array(19))).toThrow()
    // @ts-expect-error -- invalid type check
    expect(() => Currency.from(1)).toThrow()
    expect(() =>
      Currency.from('00000000000000000000000000000000000000m'),
    ).toThrow()
  })
})
