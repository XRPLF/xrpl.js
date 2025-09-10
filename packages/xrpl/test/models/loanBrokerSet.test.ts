import { validateLoanBrokerSet } from '../../src/models/transactions/loanBrokerSet'
import { assertTxIsValid, assertTxValidationError } from '../testUtils'

const assertValid = (tx: any): void =>
  assertTxIsValid(tx, validateLoanBrokerSet)

const assertInvalid = (tx: any, errorMessage: string): void =>
  assertTxValidationError(tx, validateLoanBrokerSet, errorMessage)

describe('unit test LoanBrokerSet', () => {
  let tx: any

  beforeEach(() => {
    tx = {
      TransactionType: 'LoanBrokerSet',
      VaultID:
        '000004D417A9CE049C9A71A62B004659B5F1AAAB1BEA1EFDE4E01EB3497FD999',
      LoanBrokerID:
        'E9A08C918E26407493CC4ADD381BA979CFEB7E440D0863B01FB31C231D167E42',
      Data: 'ABCD',
      ManagementFeeRate: 500,
      DebtMaximum: '10e10',
      CoverRateMinimum: 50,
      CoverRateLiquidation: 20,
      Account: 'rPGxCzMicNJRe1U1CD5QyNjXdLUtdgSa7B',
    }
  })

  test('valid tx', () => {
    assertValid(tx)
  })

  test('incorrect VaultID', () => {
    tx.VaultID = 'INCORRECT_VALUE'
    assertInvalid(tx, 'LoanBrokerSet: invalid field VaultID')

    delete tx.VaultID
    assertInvalid(tx, 'LoanBrokerSet: missing field VaultID')
  })

  test('incorrect VaultID', () => {
    tx.LoanBrokerID = 'INCORRECT_VALUE'
    assertInvalid(tx, 'LoanBrokerSet: invalid field LoanBrokerID')
  })

  test('incorrect Data', () => {
    tx.Data = 'INCORRECT_VALUE'
    assertInvalid(tx, 'LoanBrokerSet: invalid field Data')

    // TODO: refactor more
  })
})
