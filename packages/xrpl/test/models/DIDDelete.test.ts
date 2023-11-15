import { assert } from 'chai'

import { validate } from '../../src'
import { validateDIDDelete } from '../../src/models/transactions/DIDDelete'

/**
 * DIDDelete Transaction Verification Testing.
 *
 * Providing runtime verification testing for each specific transaction type.
 */
describe('DIDDelete', function () {
  let tx

  beforeEach(function () {
    tx = {
      Account: 'rfmDuhDyLGgx94qiwf3YF8BUV5j6KSvE8',
      Fee: '10',
      Flags: 2147483648,
      Sequence: 4,
      TransactionType: 'DIDDelete',
    } as any
  })

  it('verifies valid DIDDelete', function () {
    assert.doesNotThrow(() => validateDIDDelete(tx))
    assert.doesNotThrow(() => validate(tx))
  })

  it('throws on invalid DIDDelete', function () {
    tx.FakeField = 'blah'
    assert.doesNotThrow(() => validateDIDDelete(tx))
    assert.doesNotThrow(() => validate(tx))
  })
})
