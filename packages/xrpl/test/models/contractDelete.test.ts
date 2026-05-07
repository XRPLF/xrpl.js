import { validateContractDelete } from '../../src/models/transactions/contractDelete'
import { assertTxIsValid, assertTxValidationError } from '../testUtils'

const assertValid = (tx: any): void =>
  assertTxIsValid(tx, validateContractDelete)
const assertInvalid = (tx: any, message: string): void =>
  assertTxValidationError(tx, validateContractDelete, message)

/**
 * ContractDelete Transaction Verification Testing.
 *
 * Providing runtime verification testing for each specific transaction type.
 */
describe('ContractDelete', function () {
  let tx

  beforeEach(function () {
    tx = {
      TransactionType: 'ContractDelete',
      Account: 'rWYkbWkCeg8dP6rXALnjgZSjjLyih5NXm',
      ContractAccount: 'rPT1Sjq2YGrBMTttX4GZHjKu9dyfzbpAYe',
    } as any
  })

  it('verifies valid ContractDelete', function () {
    assertValid(tx)
  })

  it('throws w/ missing ContractAccount', function () {
    delete tx.ContractAccount
    assertInvalid(tx, 'ContractDelete: missing field ContractAccount')
  })

  it('throws w/ invalid ContractAccount', function () {
    tx.ContractAccount = 123
    assertInvalid(tx, 'ContractDelete: invalid field ContractAccount')
  })
})
