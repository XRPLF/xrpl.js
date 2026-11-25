import { readUInt16BE, readUInt32BE } from '../src/utils'

describe.each([
  { name: 'readUInt16BE', read: readUInt16BE, width: 2, expected: '4660' },
  { name: 'readUInt32BE', read: readUInt32BE, width: 4, expected: '305419896' },
] as const)('$name respects the array view', ({ read, width, expected }) => {
  const bytes = Uint8Array.from([0xaa, 0xbb, 0x12, 0x34, 0x56, 0x78, 0xcc])

  it('reads from a subarray with a non-zero byte offset', () => {
    expect(read(bytes.subarray(2, 6), 0)).toBe(expected)
  })

  it('treats the read offset as relative to the supplied view', () => {
    expect(read(bytes.subarray(1, 6), 1)).toBe(expected)
  })

  it('reads from a nested array view', () => {
    expect(read(bytes.subarray(1).subarray(1, 5), 0)).toBe(expected)
  })

  it('preserves reads from a complete array', () => {
    expect(read(Uint8Array.from([0x12, 0x34, 0x56, 0x78]), 0)).toBe(expected)
  })

  it('rejects a read beyond the view even if the backing buffer is large enough', () => {
    expect(() => read(bytes.subarray(0, width), 1)).toThrow(RangeError)
  })

  it('rejects a view shorter than the integer width', () => {
    expect(() => read(bytes.subarray(2, 2 + width - 1), 0)).toThrow(RangeError)
  })

  it('rejects an empty view backed by a non-empty buffer', () => {
    expect(() => read(bytes.subarray(2, 2), 0)).toThrow(RangeError)
  })
})
