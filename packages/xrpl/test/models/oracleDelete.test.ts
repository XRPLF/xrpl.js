import { validateOracleDelete } from '../../src/models/transactions/oracleDelete'
import { assertTxIsValid, assertTxValidationError } from '../testUtils'

const assertValid = (tx: any): void => assertTxIsValid(tx, validateOracleDelete)
const assertInvalid = (tx: any, message: string): void =>
  assertTxValidationError(tx, validateOracleDelete, message)

/**
 * OracleDelete Transaction Verification Testing.
 *
 * Providing runtime verification testing for each specific transaction type.
 */
describe('OracleDelete', function () {
  let tx: any

  beforeEach(function () {
    tx = {
      TransactionType: 'OracleDelete',
      Account: 'rfmDuhDyLGgx94qiwf3YF8BUV5j6KSvE8',
      OracleDocumentID: 1234,
    } as any
  })

  it('verifies valid OracleDelete', function () {
    assertValid(tx)
  })

  it(`throws w/ missing field OracleDocumentID`, function () {
    delete tx.OracleDocumentID
    const errorMessage = 'OracleDelete: missing field OracleDocumentID'
    assertInvalid(tx, errorMessage)
  })

  it(`throws w/ invalid OracleDocumentID`, function () {
    tx.OracleDocumentID = '1234'
    const errorMessage = 'OracleDelete: invalid field OracleDocumentID'
    assertInvalid(tx, errorMessage)
  })
})
