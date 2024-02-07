import { sha256 } from '@xrplf/isomorphic/sha256'
import { bytesToHex } from '@xrplf/isomorphic/utils'

describe('sha256', () => {
  it('hashes', () => {
    const hashA = sha256('abc')
    const hashB = sha256
      .create()
      .update(Uint8Array.from([97, 98, 99]))
      .digest()
    const expectedHash =
      'BA7816BF8F01CFEA414140DE5DAE2223B00361A396177A9CB410FF61F20015AD'

    expect(bytesToHex(hashA)).toEqual(expectedHash)
    expect(bytesToHex(hashB)).toEqual(expectedHash)
  })
})
