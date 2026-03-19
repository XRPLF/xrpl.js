import {
  LoanManageFlags,
  validateLoanManage,
} from '../../src/models/transactions/loanManage'
import { assertTxIsValid, assertTxValidationError } from '../testUtils'

const assertValid = (tx: any): void => assertTxIsValid(tx, validateLoanManage)

const assertInvalid = (tx: any, errorMessage: string): void =>
  assertTxValidationError(tx, validateLoanManage, errorMessage)

describe('unit test LoanManage', () => {
  let tx: any

  beforeEach(() => {
    tx = {
      TransactionType: 'LoanManage',
      LoanID:
        'E9A08C918E26407493CC4ADD381BA979CFEB7E440D0863B01FB31C231D167E42',
      Account: 'rPGxCzMicNJRe1U1CD5QyNjXdLUtdgSa7B',
    }
  })

  test('valid tx with no flags', () => {
    assertValid(tx)
  })

  test('invalid tx with both tfLoanImpair and tfLoanUnimpair flags', () => {
    // eslint-disable-next-line no-bitwise -- needed here
    tx.Flags = LoanManageFlags.tfLoanImpair | LoanManageFlags.tfLoanUnimpair
    assertInvalid(
      tx,
      'LoanManage: tfLoanImpair and tfLoanUnimpair cannot both be present',
    )
  })

  test('incorrect LoanID', () => {
    tx.LoanID = 'INCORRECT_VALUE'
    assertInvalid(
      tx,
      'LoanManage: LoanID must be 64 characters hexadecimal string',
    )
  })

  test('missing LoanID', () => {
    delete tx.LoanID
    assertInvalid(tx, 'LoanManage: missing field LoanID')
  })
})
