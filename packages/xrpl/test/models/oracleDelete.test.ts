import { assert } from 'chai'

import { validate, ValidationError } from '../../src'
import { validateOracleDelete } from '../../src/models/transactions/oracleDelete'

/**
 * OracleDelete Transaction Verification Testing.
 *
 * Providing runtime verification testing for each specific transaction type.
 */
describe('OracleDelete', function () {
  let tx

  beforeEach(function () {
    tx = {
      TransactionType: 'OracleDelete',
      Account: 'rfmDuhDyLGgx94qiwf3YF8BUV5j6KSvE8',
      OracleDocumentID: 1234,
    } as any
  })

  it('verifies valid OracleDelete', function () {
    assert.doesNotThrow(() => validateOracleDelete(tx))
    assert.doesNotThrow(() => validate(tx))
  })

  it(`throws w/ missing field OracleDocumentID`, function () {
    delete tx.OracleDocumentID
    const errorMessage = 'OracleDelete: missing field OracleDocumentID'
    assert.throws(() => validateOracleDelete(tx), ValidationError, errorMessage)
    assert.throws(() => validate(tx), ValidationError, errorMessage)
  })

  it(`throws w/ invalid OracleDocumentID`, function () {
    tx.OracleDocumentID = '1234'
    const errorMessage = 'OracleDelete: invalid field OracleDocumentID'
    assert.throws(() => validateOracleDelete(tx), ValidationError, errorMessage)
    assert.throws(() => validate(tx), ValidationError, errorMessage)
  })
})
