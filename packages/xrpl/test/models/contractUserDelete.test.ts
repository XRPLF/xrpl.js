import { validateContractUserDelete } from '../../src/models/transactions/contractUserDelete'
import { assertTxIsValid, assertTxValidationError } from '../testUtils'

const assertValid = (tx: any): void =>
  assertTxIsValid(tx, validateContractUserDelete)
const assertInvalid = (tx: any, message: string): void =>
  assertTxValidationError(tx, validateContractUserDelete, message)

/**
 * ContractUserDelete Transaction Verification Testing.
 *
 * Providing runtime verification testing for each specific transaction type.
 */
describe('ContractUserDelete', function () {
  let tx

  beforeEach(function () {
    tx = {
      TransactionType: 'ContractUserDelete',
      Account: 'rWYkbWkCeg8dP6rXALnjgZSjjLyih5NXm',
      ComputationAllowance: 1000,
      ContractAccount: 'rPT1Sjq2YGrBMTttX4GZHjKu9dyfzbpAYe',
    } as any
  })

  it('verifies valid ContractUserDelete', function () {
    assertValid(tx)
  })

  it('throws w/ missing ComputationAllowance', function () {
    delete tx.ComputationAllowance
    assertInvalid(tx, 'ContractUserDelete: missing field ComputationAllowance')
  })

  it('throws w/ invalid ComputationAllowance', function () {
    tx.ComputationAllowance = 'number'
    assertInvalid(tx, 'ContractUserDelete: invalid field ComputationAllowance')
  })

  it('throws w/ missing ContractAccount', function () {
    delete tx.ContractAccount
    assertInvalid(tx, 'ContractUserDelete: missing field ContractAccount')
  })

  it('throws w/ invalid ContractAccount', function () {
    tx.ContractAccount = 123
    assertInvalid(tx, 'ContractUserDelete: invalid field ContractAccount')
  })
})
