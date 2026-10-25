import { TokenIssuanceDestroy } from '../../src/models/transactions'
import { validateTokenIssuanceDestroy } from '../../src/models/transactions/tokenIssuanceDestroy'
import { assertTxIsValid, assertTxValidationError } from '../testUtils'

const assertValid = (tx: any): void =>
  assertTxIsValid(tx, validateTokenIssuanceDestroy)
const assertInvalid = (tx: any, message: string): void =>
  assertTxValidationError(tx, validateTokenIssuanceDestroy, message)

/**
 * TokenIssuanceDestroy Transaction Verification Testing.
 *
 * Providing runtime verification testing for each specific transaction type.
 */
describe('TokenIssuanceDestroy', function () {
  let tx: TokenIssuanceDestroy

  beforeEach(function () {
    tx = {
      TransactionType: 'TokenIssuanceDestroy',
      Account: 'rfmDuhDyLGgx94qiwf3YF8BUV5j6KSvE8',
      Currency: '0158415500000000C1F76FF6ECB0BAC600000000',
    }
  })

  it('verifies valid TokenIssuanceDestroy', function () {
    assertValid(tx)
  })

  it('throws w/ missing Currency', function () {
    // @ts-expect-error for test
    tx.Currency = undefined
    assertInvalid(tx, 'TokenIssuanceDestroy: missing field Currency')
  })

  it('throws w/ non-string Currency', function () {
    // @ts-expect-error for test
    tx.Currency = 1
    assertInvalid(tx, 'TokenIssuanceDestroy: invalid field Currency')
  })

  it('throws w/ the no-currency hex Currency', function () {
    tx.Currency = `${'0'.repeat(39)}1`
    assertInvalid(tx, 'TokenIssuanceDestroy: invalid field Currency')
  })

  it('throws w/ an unknown flag', function () {
    tx.Flags = 0x00000001
    assertInvalid(tx, 'TokenIssuanceDestroy: invalid Flags')
  })
})
