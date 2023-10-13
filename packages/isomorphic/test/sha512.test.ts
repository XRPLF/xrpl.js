import { sha512 } from '@xrplf/isomorphic/sha512'
import { bytesToHex } from '@xrplf/isomorphic/utils'

describe('sha512', () => {
  it('hashes', () => {
    const hashA = sha512('abc')
    const hashB = sha512
      .create()
      .update(Uint8Array.from([97, 98, 99]))
      .digest()
    const expectedHash =
      'DDAF35A193617ABACC417349AE20413112E6FA4E89A97EA20A9EEEE64B55D39A2192992A274FC1A836BA3C23A3FEEBBD454D4423643CE80E2A9AC94FA54CA49F'

    expect(bytesToHex(hashA)).toEqual(expectedHash)
    expect(bytesToHex(hashB)).toEqual(expectedHash)
  })
})
