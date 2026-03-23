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
    assertInvalid(tx, 'AccountSet: invalid SetFlag')
  })

  it(`throws w/ invalid SetFlag (incorrect type)`, function () {
    tx.SetFlag = 'abc'
    assertInvalid(tx, 'AccountSet: invalid SetFlag')
  })

  it(`throws w/ invalid ClearFlag`, function () {
    tx.ClearFlag = 20
    assertInvalid(tx, 'AccountSet: invalid ClearFlag')
  })

  it(`throws w/ invalid Domain`, function () {
    tx.Domain = 6578616
    assertInvalid(tx, 'AccountSet: invalid Domain')
  })

  it(`throws w/ invalid EmailHash`, function () {
    tx.EmailHash = 6578656789876543
    assertInvalid(tx, 'AccountSet: invalid EmailHash')
  })

  it(`throws w/ invalid MessageKey`, function () {
    tx.MessageKey = 6578656789876543
    assertInvalid(tx, 'AccountSet: invalid MessageKey')
  })

  it(`throws w/ invalid TransferRate`, function () {
    tx.TransferRate = '1000000001'
    assertInvalid(tx, 'AccountSet: invalid TransferRate')
  })

  it(`throws w/ invalid TickSize`, function () {
    tx.TickSize = 20
    assertInvalid(tx, 'AccountSet: invalid TickSize')
  })

  it(`throws w/ invalid NFTokenMinter`, function () {
    tx.NFTokenMinter = ''
    assertInvalid(tx, 'AccountSet: invalid field NFTokenMinter')
  })
})
