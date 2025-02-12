import { assert } from 'chai'

import { validate, ValidationError } from '../../src'
import { validateAccountSet } from '../../src/models/transactions/accountSet'

/**
 * AccountSet Transaction Verification Testing.
 *
 * Providing runtime verification testing for each specific transaction type.
 */
describe('AccountSet', function () {
  let account

  beforeEach(function () {
    account = {
      TransactionType: 'AccountSet',
      Account: 'rf1BiGeXwwQoi8Z2ueFYTEXSwuJYfV2Jpn',
      Fee: '12',
      Sequence: 5,
      Domain: '6578616D706C652E636F6D',
      SetFlag: 5,
      MessageKey:
        '03AB40A0490F9B7ED8DF29D246BF2D6269820A0EE7742ACDD457BEA7C7D0931EDB',
    } as any
  })

  it(`verifies valid AccountSet`, function () {
    assert.doesNotThrow(() => validateAccountSet(account))
    assert.doesNotThrow(() => validate(account))
  })

  it(`throws w/ invalid SetFlag (out of range)`, function () {
    account.SetFlag = 20

    assert.throws(
      () => validateAccountSet(account),
      ValidationError,
      'AccountSet: invalid field SetFlag',
    )
    assert.throws(
      () => validate(account),
      ValidationError,
      'AccountSet: invalid field SetFlag',
    )
  })

  it(`throws w/ invalid SetFlag (incorrect type)`, function () {
    account.SetFlag = 'abc'

    assert.throws(
      () => validateAccountSet(account),
      ValidationError,
      'AccountSet: invalid field SetFlag',
    )
    assert.throws(
      () => validate(account),
      ValidationError,
      'AccountSet: invalid field SetFlag',
    )
  })

  it(`throws w/ invalid ClearFlag`, function () {
    account.ClearFlag = 20

    assert.throws(
      () => validateAccountSet(account),
      ValidationError,
      'AccountSet: invalid field ClearFlag',
    )
    assert.throws(
      () => validate(account),
      ValidationError,
      'AccountSet: invalid field ClearFlag',
    )
  })

  it(`throws w/ invalid Domain`, function () {
    account.Domain = 6578616

    assert.throws(
      () => validateAccountSet(account),
      ValidationError,
      'AccountSet: invalid field Domain',
    )
    assert.throws(
      () => validate(account),
      ValidationError,
      'AccountSet: invalid field Domain',
    )
  })

  it(`throws w/ invalid EmailHash`, function () {
    account.EmailHash = 6578656789876543

    assert.throws(
      () => validateAccountSet(account),
      ValidationError,
      'AccountSet: invalid field EmailHash',
    )
    assert.throws(
      () => validate(account),
      ValidationError,
      'AccountSet: invalid field EmailHash',
    )
  })

  it(`throws w/ invalid MessageKey`, function () {
    account.MessageKey = 6578656789876543

    assert.throws(
      () => validateAccountSet(account),
      ValidationError,
      'AccountSet: invalid field MessageKey',
    )
    assert.throws(
      () => validate(account),
      ValidationError,
      'AccountSet: invalid field MessageKey',
    )
  })

  it(`throws w/ invalid TransferRate`, function () {
    account.TransferRate = 'abcd'

    assert.throws(
      () => validateAccountSet(account),
      ValidationError,
      'AccountSet: invalid field TransferRate',
    )
    assert.throws(
      () => validate(account),
      ValidationError,
      'AccountSet: invalid field TransferRate',
    )
  })

  it(`throws w/ invalid TickSize`, function () {
    account.TickSize = 20

    assert.throws(
      () => validateAccountSet(account),
      ValidationError,
      'AccountSet: invalid field TickSize',
    )
    assert.throws(
      () => validate(account),
      ValidationError,
      'AccountSet: invalid field TickSize',
    )
  })

  it(`throws w/ invalid NFTokenMinter`, function () {
    account.NFTokenMinter = ''

    assert.throws(
      () => validateAccountSet(account),
      ValidationError,
      'AccountSet: invalid field NFTokenMinter',
    )
    assert.throws(
      () => validate(account),
      ValidationError,
      'AccountSet: invalid field NFTokenMinter',
    )
  })
})
