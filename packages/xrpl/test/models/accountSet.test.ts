import { validateAccountSet } from '../../src/models/transactions/accountSet'
import { assertTxIsValid, assertTxValidationError } from '../testUtils'

const assertValid = (tx: any): void => assertTxIsValid(tx, validateAccountSet)
const assertInvalid = (tx: any, message: string): void =>
  assertTxValidationError(tx, validateAccountSet, message)

/**
 * AccountSet Transaction Verification Testing.
 *
 * Providing runtime verification testing for each specific transaction type.
 */
describe('AccountSet', function () {
  let tx: any

  beforeEach(function () {
    tx = {
      TransactionType: 'AccountSet',
      Account: 'rf1BiGeXwwQoi8Z2ueFYTEXSwuJYfV2Jpn',
      Fee: '12',
      Sequence: 5,
      Domain: '6578616D706C652E636F6D',
      SetFlag: 5,
      MessageKey:
        '03AB40A0490F9B7ED8DF29D246BF2D6269820A0EE7742ACDD457BEA7C7D0931EDB',
    }
  })

  it(`verifies valid AccountSet`, function () {
    assertValid(tx)
  })

  it(`throws w/ invalid SetFlag (out of range)`, function () {
    tx.SetFlag = 20
    assertInvalid(tx, 'AccountSet: not a valid SetFlag value')
  })

  it(`throws w/ invalid SetFlag (incorrect type)`, function () {
    tx.SetFlag = 'abc'
    assertInvalid(
      tx,
      'AccountSet: invalid field SetFlag, expected a valid number',
    )
  })

  it(`throws w/ invalid ClearFlag`, function () {
    tx.ClearFlag = 20
    assertInvalid(tx, 'AccountSet: not a valid ClearFlag value')
  })

  it(`throws w/ invalid Domain`, function () {
    tx.Domain = 6578616
    assertInvalid(
      tx,
      'AccountSet: invalid field Domain, expected a valid hex string',
    )
  })

  it(`throws w/ invalid EmailHash`, function () {
    tx.EmailHash = 6578656789876543
    assertInvalid(
      tx,
      'AccountSet: invalid field EmailHash, expected a valid hex string',
    )
  })

  it(`throws w/ invalid MessageKey`, function () {
    tx.MessageKey = 6578656789876543
    assertInvalid(
      tx,
      'AccountSet: invalid field MessageKey, expected a valid hex string',
    )
  })

  it(`throws w/ invalid TransferRate`, function () {
    tx.TransferRate = 'abcd'
    assertInvalid(
      tx,
      'AccountSet: invalid field TransferRate, expected a valid number',
    )
  })

  it(`throws w/ invalid TickSize`, function () {
    tx.TickSize = 20
    assertInvalid(
      tx,
      'AccountSet: invalid field TickSize, expected a valid number',
    )
  })

  it(`throws w/ invalid NFTokenMinter`, function () {
    tx.NFTokenMinter = ''
    assertInvalid(
      tx,
      'AccountSet: invalid field NFTokenMinter, expected a valid account address',
    )
  })
})
