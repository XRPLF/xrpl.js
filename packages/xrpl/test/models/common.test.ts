import { isCurrency } from '../../src/models/transactions/common'
import { MPTID_LENGTH } from '../testUtils'

describe('isCurrency', function () {
  it('rejects malformed MPT mpt_issuance_id (non-hex or wrong length)', function () {
    // wrong length
    expect(isCurrency({ mpt_issuance_id: 'A'.repeat(MPTID_LENGTH - 1) })).toBe(
      false,
    )
    expect(isCurrency({ mpt_issuance_id: 'A'.repeat(MPTID_LENGTH + 1) })).toBe(
      false,
    )
    // correct length but contains non-hex characters
    expect(isCurrency({ mpt_issuance_id: 'Z'.repeat(MPTID_LENGTH) })).toBe(
      false,
    )
    // canonical hex form passes
    expect(isCurrency({ mpt_issuance_id: 'A'.repeat(MPTID_LENGTH) })).toBe(true)
  })
})
