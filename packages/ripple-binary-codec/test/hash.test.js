const { coreTypes } = require('../dist/types')
const { Hash160, Hash256, Currency, AccountID } = coreTypes

describe('Hash160', function () {
  test('has a static width membmer', function () {
    expect(Hash160.width).toBe(20)
  })
  test('inherited by subclasses', function () {
    expect(AccountID.width).toBe(20)
    expect(Currency.width).toBe(20)
  })
  test('can be compared against another', function () {
    const h1 = Hash160.from('1000000000000000000000000000000000000000')
    const h2 = Hash160.from('2000000000000000000000000000000000000000')
    const h3 = Hash160.from('0000000000000000000000000000000000000003')
    expect(h1.lt(h2)).toBe(true)
    expect(h3.lt(h2)).toBe(true)
  })
})

describe('Hash256', function () {
  test('has a static width membmer', function () {
    expect(Hash256.width).toBe(32)
  })
  test('has a ZERO_256 member', function () {
    expect(Hash256.ZERO_256.toJSON()).toBe('0000000000000000000000000000000000000000000000000000000000000000')
  })
  test('supports getting the nibblet values at given positions', function () {
    const h = Hash256.from(
      '1359BD0000000000000000000000000000000000000000000000000000000000')
    expect(h.nibblet(0)).toBe(0x1)
    expect(h.nibblet(1)).toBe(0x3)
    expect(h.nibblet(2)).toBe(0x5)
    expect(h.nibblet(3)).toBe(0x9)
    expect(h.nibblet(4)).toBe(0x0b)
    expect(h.nibblet(5)).toBe(0xd)
  })
})

describe('Currency', function () {
  test('Will have a null iso() for dodgy XRP ', function () {
    const bad = Currency.from('0000000000000000000000005852500000000000')
    expect(bad.iso()).toBeNull()
    expect(bad.isNative()).toBe(false)
  })
  test('can be constructed from an Array', function () {
    const xrp = Currency.from(new Uint8Array(20))
    expect(xrp.iso()).toBe('XRP')
  })
  test('throws on invalid reprs', function () {
    expect(() => Currency.from(new Uint8Array(19))).toThrow()
    expect(() => Currency.from(1)).toThrow()
    expect(() => Currency.from(
      '00000000000000000000000000000000000000m')).toThrow()
  })
})
