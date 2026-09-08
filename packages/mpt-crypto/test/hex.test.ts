import { bytesToHex, hexToBytes } from '../src'

describe('hex', () => {
  it('round-trips bytes to uppercase hex and back', () => {
    const bytes = Uint8Array.from([0x00, 0x0f, 0xab, 0xff])
    expect(bytesToHex(bytes)).toBe('000FABFF')
    expect(Array.from(hexToBytes('000FABFF', 'value'))).toEqual(
      Array.from(bytes),
    )
  })

  it('rejects odd-length or non-hex strings', () => {
    expect(() => hexToBytes('ABC', 'value')).toThrow(/even-length hex/u)
    expect(() => hexToBytes('zz', 'value')).toThrow(/even-length hex/u)
  })

  it('enforces an expected byte length when given one', () => {
    expect(() => hexToBytes('AABB', 'value', 3)).toThrow(/must be 3 bytes/u)
    expect(hexToBytes('AABBCC', 'value', 3)).toHaveLength(3)
  })
})
