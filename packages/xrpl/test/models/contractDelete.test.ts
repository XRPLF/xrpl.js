import { ContractDelete } from '../../src/models/transactions'
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
  let tx: ContractDelete

  beforeEach(function () {
    tx = {
      TransactionType: 'ContractDelete',
      Account: 'rfmDuhDyLGgx94qiwf3YF8BUV5j6KSvE8',
      ContractAccount: 'rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh',
    }
  })

  it('verifies valid ContractDelete', function () {
    assertValid(tx)
  })

  it('throws w/ missing ContractAccount', function () {
    delete (tx as any).ContractAccount
    assertInvalid(tx, 'ContractDelete: missing field ContractAccount')
  })

  it('throws w/ invalid ContractAccount', function () {
    tx.ContractAccount = 123 as any
    assertInvalid(tx, 'ContractDelete: invalid field ContractAccount')
  })
})
