import { ripemd160 } from '@xrplf/isomorphic/ripemd160'
import { bytesToHex } from '@xrplf/isomorphic/utils'

describe('ripemd160', () => {
  it('hashes', () => {
    const hashA = ripemd160('abc')
    const hashB = ripemd160
      .create()
      .update(Uint8Array.from([97, 98, 99]))
      .digest()
    const expectedHash = `8EB208F7E05D987A9B044A8E98C6B087F15A0BFC`

    expect(bytesToHex(hashA)).toEqual(expectedHash)
    expect(bytesToHex(hashB)).toEqual(expectedHash)
  })
})
