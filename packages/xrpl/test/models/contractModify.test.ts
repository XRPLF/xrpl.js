import { validateContractModify } from '../../src/models/transactions/contractModify'
import { assertTxIsValid, assertTxValidationError } from '../testUtils'

const assertValid = (tx: any): void =>
  assertTxIsValid(tx, validateContractModify)
const assertInvalid = (tx: any, message: string): void =>
  assertTxValidationError(tx, validateContractModify, message)

/**
 * ContractModify Transaction Verification Testing.
 *
 * Providing runtime verification testing for each specific transaction type.
 */
describe('ContractModify', function () {
  let tx

  beforeEach(function () {
    tx = {
      TransactionType: 'ContractModify',
      Account: 'rWYkbWkCeg8dP6rXALnjgZSjjLyih5NXm',
      ContractAccount: 'rPT1Sjq2YGrBMTttX4GZHjKu9dyfzbpAYe',
      ContractHash:
        'E5287A664638EDC1110BAF0FD3FF79013353FD797EF14FC970E552ED7097B721',
    } as any
  })

  it('verifies valid ContractModify', function () {
    assertValid(tx)
  })

  it('throws w/ invalid ContractAccount', function () {
    tx.ContractAccount = 123
    assertInvalid(tx, 'ContractModify: invalid field ContractAccount')
  })

  it('throws w/ invalid ContractCode', function () {
    tx.ContractCode = 123
    assertInvalid(tx, 'ContractModify: invalid field ContractCode')
  })

  it('throws w/ invalid ContractHash', function () {
    tx.ContractHash = 123
    assertInvalid(tx, 'ContractModify: invalid field ContractHash')
  })

  it('throws w/ invalid Functions', function () {
    tx.Functions = 'not_an_array'
    assertInvalid(tx, 'ContractModify: invalid field Functions')
  })

  it('throws w/ invalid InstanceParameters', function () {
    tx.InstanceParameters = 'not_an_array'
    assertInvalid(tx, 'ContractModify: invalid field InstanceParameters')
  })

  it('throws w/ invalid InstanceParameterValues', function () {
    tx.InstanceParameterValues = 'not_an_array'
    assertInvalid(tx, 'ContractModify: invalid field InstanceParameterValues')
  })

  it('throws w/ invalid URI', function () {
    tx.URI = 123
    assertInvalid(tx, 'ContractModify: invalid field URI')
  })
})
