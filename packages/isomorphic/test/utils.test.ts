import { bytesToHex, hexToBytes, randomBytes } from '../utils'

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
})
