import { validateLoanBrokerDelete } from '../../src/models/transactions/loanBrokerDelete'
import { assertTxIsValid, assertTxValidationError } from '../testUtils'

const assertValid = (tx: any): void =>
  assertTxIsValid(tx, validateLoanBrokerDelete)

const assertInvalid = (tx: any, errorMessage: string): void =>
  assertTxValidationError(tx, validateLoanBrokerDelete, errorMessage)

describe('unit test LoanBrokerDelete', () => {
  let tx: any

  beforeEach(() => {
    tx = {
      TransactionType: 'LoanBrokerDelete',
      LoanBrokerID:
        'E9A08C918E26407493CC4ADD381BA979CFEB7E440D0863B01FB31C231D167E42',
      Account: 'rPGxCzMicNJRe1U1CD5QyNjXdLUtdgSa7B',
    }
  })

  test('valid tx', () => {
    assertValid(tx)
  })

  test('incorrect LoanBrokerID', () => {
    tx.LoanBrokerID = 'INCORRECT_VALUE'
    assertInvalid(
      tx,
      'LoanBrokerDelete: LoanBrokerID must be 64 characters hexadecimal string',
    )

    delete tx.LoanBrokerID
    assertInvalid(tx, 'LoanBrokerDelete: missing field LoanBrokerID')
  })
})
