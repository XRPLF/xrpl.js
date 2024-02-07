import {
  bytesToHex,
  hexToBytes,
  hexToString,
  randomBytes,
  stringToHex,
} from '../utils'

describe('utils', function () {
  it('randomBytes', () => {
    expect(randomBytes(16).byteLength).toEqual(16)
  })

  it('hexToBytes - empty', () => {
    expect(hexToBytes('')).toEqual(new Uint8Array([]))
  })

  it('hexToBytes - zero', () => {
    expect(hexToBytes('000000')).toEqual(new Uint8Array([0, 0, 0]))
  })

  it('hexToBytes - DEADBEEF', () => {
    expect(hexToBytes('DEADBEEF')).toEqual(new Uint8Array([222, 173, 190, 239]))
  })

  it('bytesToHex - DEADBEEF', () => {
    expect(bytesToHex([222, 173, 190, 239])).toEqual('DEADBEEF')
  })

  it('bytesToHex - 010203', () => {
    expect(bytesToHex([1, 2, 3])).toEqual('010203')
  })

  it('bytesToHex - DEADBEEF (Uint8Array)', () => {
    expect(bytesToHex(new Uint8Array([222, 173, 190, 239]))).toEqual('DEADBEEF')
  })

  it('hexToString - deadbeef+infinity symbol (HEX ASCII)', () => {
    expect(hexToString('646561646265656658D', 'ascii')).toEqual('deadbeefX')
  })

  it('hexToString - deadbeef+infinity symbol (HEX)', () => {
    expect(hexToString('6465616462656566D68D')).toEqual('deadbeef֍')
  })

  it('stringToHex - deadbeef+infinity symbol (utf8)', () => {
    expect(stringToHex('deadbeef֍')).toEqual('6465616462656566D68D')
  })
})
