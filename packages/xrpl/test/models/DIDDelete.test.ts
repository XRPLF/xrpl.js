import { validateDIDDelete } from '../../src/models/transactions/DIDDelete'
import { assertTxIsValid } from '../testUtils'

const assertValid = (tx: any): void => assertTxIsValid(tx, validateDIDDelete)

/**
 * DIDDelete Transaction Verification Testing.
 *
 * Providing runtime verification testing for each specific transaction type.
 */
describe('DIDDelete', function () {
  let tx: any

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
    assertValid(tx)
  })
})
