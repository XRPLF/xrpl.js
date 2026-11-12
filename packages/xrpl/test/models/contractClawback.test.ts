import { validateContractClawback } from '../../src/models/transactions/contractClawback'
import { assertTxIsValid, assertTxValidationError } from '../testUtils'

const assertValid = (tx: any): void =>
  assertTxIsValid(tx, validateContractClawback)
const assertInvalid = (tx: any, message: string): void =>
  assertTxValidationError(tx, validateContractClawback, message)

/**
 * ContractClawback Transaction Verification Testing.
 *
 * Providing runtime verification testing for each specific transaction type.
 */
describe('ContractClawback', function () {
  let tx

  beforeEach(function () {
    tx = {
      TransactionType: 'ContractClawback',
      Account: 'rWYkbWkCeg8dP6rXALnjgZSjjLyih5NXm',
      Amount: {
        currency: 'USD',
        value: '1000',
        issuer: 'rWYkbWkCeg8dP6rXALnjgZSjjLyih5NXm',
      },
    } as any
  })

  it('verifies valid ContractClawback', function () {
    assertValid(tx)
  })

  it('throws w/ missing Amount', function () {
    delete tx.Amount
    assertInvalid(tx, 'ContractClawback: missing field Amount')
  })

  it('throws w/ invalid Amount', function () {
    tx.Amount = { currency: 'ETH' }
    assertInvalid(tx, 'ContractClawback: invalid field Amount')
  })

  it('throws w/ invalid ContractAccount', function () {
    tx.ContractAccount = 123
    assertInvalid(tx, 'ContractClawback: invalid field ContractAccount')
  })
})
