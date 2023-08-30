import { sha256 } from '@xrplf/isomoprhic/sha256'
import { bytesToHex } from '@xrplf/isomoprhic/utils'

describe('sha256', () => {
  it('hashes', () => {
    const h2a = sha256('abc')
    const h2b = sha256
      .create()
      .update(Uint8Array.from([97, 98, 99]))
      .digest()

    expect(bytesToHex(h2a)).toEqual(
      'BA7816BF8F01CFEA414140DE5DAE2223B00361A396177A9CB410FF61F20015AD',
    )
    expect(bytesToHex(h2b)).toEqual(
      'BA7816BF8F01CFEA414140DE5DAE2223B00361A396177A9CB410FF61F20015AD',
    )
  })
})
