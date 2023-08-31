import { sha512 } from '@xrplf/isomorphic/sha512'
import { bytesToHex } from '@xrplf/isomorphic/utils'

describe('sha512', () => {
  it('hashes', () => {
    const h2a = sha512('abc')
    const h2b = sha512
      .create()
      .update(Uint8Array.from([97, 98, 99]))
      .digest()

    expect(bytesToHex(h2a)).toEqual(
      'DDAF35A193617ABACC417349AE20413112E6FA4E89A97EA20A9EEEE64B55D39A2192992A274FC1A836BA3C23A3FEEBBD454D4423643CE80E2A9AC94FA54CA49F',
    )
    expect(bytesToHex(h2b)).toEqual(
      'DDAF35A193617ABACC417349AE20413112E6FA4E89A97EA20A9EEEE64B55D39A2192992A274FC1A836BA3C23A3FEEBBD454D4423643CE80E2A9AC94FA54CA49F',
    )
  })
})
