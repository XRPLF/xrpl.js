import { validateContractCreate } from '../../src/models/transactions/contractCreate'
import { assertTxIsValid, assertTxValidationError } from '../testUtils'

const assertValid = (tx: any): void =>
  assertTxIsValid(tx, validateContractCreate)
const assertInvalid = (tx: any, message: string): void =>
  assertTxValidationError(tx, validateContractCreate, message)

/**
 * ContractCreate Transaction Verification Testing.
 *
 * Providing runtime verification testing for each specific transaction type.
 */
describe('ContractCreate', function () {
  let tx

  beforeEach(function () {
    tx = {
      TransactionType: 'ContractCreate',
      Account: 'rWYkbWkCeg8dP6rXALnjgZSjjLyih5NXm',
      ContractHash:
        'E5287A664638EDC1110BAF0FD3FF79013353FD797EF14FC970E552ED7097B721',
    } as any
  })

  it('verifies valid ContractCreate', function () {
    assertValid(tx)
  })

  it('throws w/ invalid ContractCode', function () {
    tx.ContractCode = 123
    assertInvalid(tx, 'ContractCreate: invalid field ContractCode')
  })

  it('throws w/ invalid ContractHash', function () {
    tx.ContractHash = 123
    assertInvalid(tx, 'ContractCreate: invalid field ContractHash')
  })

  it('throws w/ invalid Functions', function () {
    tx.Functions = 'not_an_array'
    assertInvalid(tx, 'ContractCreate: invalid field Functions')
  })

  it('throws w/ invalid InstanceParameters', function () {
    tx.InstanceParameters = 'not_an_array'
    assertInvalid(tx, 'ContractCreate: invalid field InstanceParameters')
  })

  it('throws w/ invalid InstanceParameterValues', function () {
    tx.InstanceParameterValues = 'not_an_array'
    assertInvalid(tx, 'ContractCreate: invalid field InstanceParameterValues')
  })

  it('throws w/ invalid URI', function () {
    tx.URI = 123
    assertInvalid(tx, 'ContractCreate: invalid field URI')
  })
})
