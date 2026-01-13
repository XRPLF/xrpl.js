import { validateLoanBrokerCoverWithdraw } from '../../src/models/transactions/loanBrokerCoverWithdraw'
import { assertTxIsValid, assertTxValidationError } from '../testUtils'

const assertValid = (tx: any): void =>
  assertTxIsValid(tx, validateLoanBrokerCoverWithdraw)

const assertInvalid = (tx: any, errorMessage: string): void =>
  assertTxValidationError(tx, validateLoanBrokerCoverWithdraw, errorMessage)

describe('unit test LoanBrokerCoverWithdraw', () => {
  let tx: any

  beforeEach(() => {
    tx = {
      TransactionType: 'LoanBrokerCoverWithdraw',
      LoanBrokerID:
        'E9A08C918E26407493CC4ADD381BA979CFEB7E440D0863B01FB31C231D167E42',
      Account: 'rPGxCzMicNJRe1U1CD5QyNjXdLUtdgSa7B',
      Amount: {
        mpt_issuance_id: '0000012FFD9EE5DA93AC614B4DB94D7E0FCE415CA51BED47',
        value: '1000000',
      },
      Destination: 'rPvt4Ff6G7Y1kxjk6h3jjwTvtmDSaNa8Wh',
    }
  })

  test('valid tx', () => {
    assertValid(tx)
  })

  test('incorrect LoanBrokerID', () => {
    tx.LoanBrokerID = 'INCORRECT_VALUE'
    assertInvalid(
      tx,
      'LoanBrokerCoverWithdraw: LoanBrokerID must be 64 characters hexadecimal string',
    )

    delete tx.LoanBrokerID
    assertInvalid(tx, 'LoanBrokerCoverWithdraw: missing field LoanBrokerID')
  })

  test('incorrect Amount', () => {
    tx.Amount = {
      mpt_issuanceId: '0000012FFD9EE5DA93AC614B4DB94D7E0FCE415CA51BED47',
      value: '1000000',
    }
    assertInvalid(tx, 'LoanBrokerCoverWithdraw: invalid field Amount')

    delete tx.Amount
    assertInvalid(tx, 'LoanBrokerCoverWithdraw: missing field Amount')
  })
})
