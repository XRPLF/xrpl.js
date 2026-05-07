import { validateLoanBrokerCoverClawback } from '../../src/models/transactions/loanBrokerCoverClawback'
import { assertTxIsValid, assertTxValidationError } from '../testUtils'

const assertValid = (tx: any): void =>
  assertTxIsValid(tx, validateLoanBrokerCoverClawback)

const assertInvalid = (tx: any, errorMessage: string): void =>
  assertTxValidationError(tx, validateLoanBrokerCoverClawback, errorMessage)

describe('unit test LoanBrokerCoverClawback', () => {
  let tx: any

  beforeEach(() => {
    tx = {
      TransactionType: 'LoanBrokerCoverClawback',
      LoanBrokerID:
        'E9A08C918E26407493CC4ADD381BA979CFEB7E440D0863B01FB31C231D167E42',
      Account: 'rPGxCzMicNJRe1U1CD5QyNjXdLUtdgSa7B',
      Amount: {
        mpt_issuance_id: '0000012FFD9EE5DA93AC614B4DB94D7E0FCE415CA51BED47',
        value: '1000000',
      },
    }
  })

  test('valid tx', () => {
    assertValid(tx)
  })

  test('incorrect LoanBrokerID', () => {
    tx.LoanBrokerID = 'INCORRECT_VALUE'
    assertInvalid(
      tx,
      'LoanBrokerCoverClawback: LoanBrokerID must be 64 characters hexadecimal string',
    )
  })

  test('incorrect Amount', () => {
    tx.Amount = {
      mpt_issuanceId: '0000012FFD9EE5DA93AC614B4DB94D7E0FCE415CA51BED47',
      value: '1000000',
    }
    assertInvalid(tx, 'LoanBrokerCoverClawback: invalid field Amount')

    tx.Amount = '100'
    assertInvalid(tx, 'LoanBrokerCoverClawback: invalid field Amount')
  })

  test('missing LoanBrokerId and Amount', () => {
    delete tx.LoanBrokerID
    delete tx.Amount
    assertInvalid(
      tx,
      'LoanBrokerCoverClawback: Either LoanBrokerID or Amount is required',
    )
  })
})
