import { validateContractCall } from '../../src/models/transactions/contractCall'
import { assertTxIsValid, assertTxValidationError } from '../testUtils'

const assertValid = (tx: any): void => assertTxIsValid(tx, validateContractCall)
const assertInvalid = (tx: any, message: string): void =>
  assertTxValidationError(tx, validateContractCall, message)

/**
 * ContractCall Transaction Verification Testing.
 *
 * Providing runtime verification testing for each specific transaction type.
 */
describe('ContractCall', function () {
  let tx

  beforeEach(function () {
    tx = {
      TransactionType: 'ContractCall',
      Account: 'rWYkbWkCeg8dP6rXALnjgZSjjLyih5NXm',
      ComputationAllowance: 1000,
      ContractAccount: 'rPT1Sjq2YGrBMTttX4GZHjKu9dyfzbpAYe',
      FunctionName: 'noop',
    } as any
  })

  it('verifies valid ContractCall', function () {
    assertValid(tx)
  })

  it('throws w/ missing ComputationAllowance', function () {
    delete tx.ComputationAllowance
    assertInvalid(tx, 'ContractCall: missing field ComputationAllowance')
  })

  it('throws w/ invalid ComputationAllowance', function () {
    tx.ComputationAllowance = 'number'
    assertInvalid(tx, 'ContractCall: invalid field ComputationAllowance')
  })

  it('throws w/ missing ContractAccount', function () {
    delete tx.ContractAccount
    assertInvalid(tx, 'ContractCall: missing field ContractAccount')
  })

  it('throws w/ invalid ContractAccount', function () {
    tx.ContractAccount = 123
    assertInvalid(tx, 'ContractCall: invalid field ContractAccount')
  })

  it('throws w/ missing FunctionName', function () {
    delete tx.FunctionName
    assertInvalid(tx, 'ContractCall: missing field FunctionName')
  })

  it('throws w/ invalid FunctionName', function () {
    tx.FunctionName = 123
    assertInvalid(tx, 'ContractCall: invalid field FunctionName')
  })

  it('throws w/ invalid Parameters', function () {
    tx.Parameters = 'not_an_array'
    assertInvalid(tx, 'ContractCall: invalid field Parameters')
  })
})
