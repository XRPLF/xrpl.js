const { slice, compareBytes, parseBytes, bytesToHex } = require('../dist/utils/bytes-utils')

describe('bytes-utils', function () {
  describe('parseBytes', function () {
    test('can decode hex', function () {
      expect(parseBytes('0012')).toEqual([0x00, 0x12])
      expect(parseBytes('0012')).toEqual([0x00, 0x12])
      expect(parseBytes('00AA')).toEqual([0x00, 0xaa])
    })
    test('can decode hex to a Uint8Array', function () {
      const result = parseBytes('0012', Uint8Array)
      expect(result instanceof Uint8Array).toBe(true)
      expect(result).toEqual(Uint8Array.from([0x00, 0x12]))
    })
    test('can convert a list to a Uint8Array', function () {
      const result = parseBytes([0x00, 0x12], Uint8Array)
      expect(result instanceof Uint8Array).toBe(true)
      expect(result).toEqual(Uint8Array.from([0x00, 0x12]))
    })
    test('can decode hex to a Buffer', function () {
      const result = parseBytes('0012', Buffer)
      expect(result instanceof Buffer).toBe(true)
      expect(result.toJSON().data).toEqual([0x00, 0x12])
    })
  })

  describe('bytesToHex', function () {
    test('can encode an array as hex', function () {
      expect(bytesToHex([0x00, 0xaa])).toBe('00AA')
      expect(bytesToHex([0xaa])).toBe('AA')
    })
    test('can encode Uint8Array as hex', function () {
      expect(bytesToHex(new Uint8Array([0x00, 0xaa]))).toBe('00AA')
      expect(bytesToHex(new Uint8Array([0xaa]))).toBe('AA')
    })
  })

  describe('compareBytes', function () {
    test('compares the bytes sequence as big endian number', function () {
      expect(compareBytes([0, 1, 2], [1, 2, 3])).toBe(-1)
    })
    test('throws when the bytes sequences are of unlike length', function () {
      expect(() => compareBytes([0, 1], [1])).toThrow()
    })
  })

  describe('slice', function () {
    const val = [1, 2, 3, 4, 5]
    test('creates a slice of the same type as first arg', function () {
      expect(Array.isArray(slice(val))).toBe(true)
    })
    test('the 2nd arg is the start position [2:]', function () {
      expect(val.slice(2)).toEqual([3, 4, 5])
      expect(slice(val, 2)).toEqual([3, 4, 5])
    })
    test('the 3rd arg is the end position [2:4]', function () {
      expect(slice(val, 2, 4)).toEqual([3, 4])
    })
    test('can slice using negative numbers [-3:]', function () {
      expect(slice(val, -3)).toEqual([3, 4, 5])
    })
    test('can slice using negative numbers [-3:-1]', function () {
      expect(slice(val, -3, -1)).toEqual([3, 4])
    })
    test('the 4th arg is the output class type', function () {
      expect(slice(val, 2, 4, Buffer).toJSON().data).toEqual([3, 4])
      expect(slice(val, 2, 4, Uint8Array)).toEqual(Uint8Array.from([3, 4]))
    })
  })
})
