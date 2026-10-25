import { ContractUserDelete } from '../../src/models/transactions'
import { validateContractUserDelete } from '../../src/models/transactions/contractUserDelete'
import { assertTxValidationError } from '../testUtils'

const assertInvalid = (tx: any, message: string): void =>
  assertTxValidationError(tx, validateContractUserDelete, message)

const DISABLED =
  'ContractUserDelete: the node refuses every ContractUserDelete (temDISABLED)'

/**
 * ContractUserDelete Transaction Verification Testing.
 *
 * Providing runtime verification testing for each specific transaction type.
 */
describe('ContractUserDelete', function () {
  let tx: ContractUserDelete

  beforeEach(function () {
    tx = {
      TransactionType: 'ContractUserDelete',
      Account: 'rfmDuhDyLGgx94qiwf3YF8BUV5j6KSvE8',
      ContractAccount: 'rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh',
      Gas: 1000,
    }
  })

  it('throws temDISABLED for a well-formed ContractUserDelete', function () {
    assertInvalid(tx, DISABLED)
  })

  it('throws w/ missing ContractAccount', function () {
    delete (tx as any).ContractAccount
    assertInvalid(tx, 'ContractUserDelete: missing field ContractAccount')
  })

  it('throws w/ invalid ContractAccount', function () {
    tx.ContractAccount = 'not an account'
    assertInvalid(tx, 'ContractUserDelete: invalid field ContractAccount')
  })

  it('throws w/ missing Gas', function () {
    delete (tx as any).Gas
    assertInvalid(tx, 'ContractUserDelete: missing field Gas')
  })

  it('throws w/ invalid Gas', function () {
    tx.Gas = -1
    assertInvalid(tx, 'ContractUserDelete: invalid field Gas')
    tx.Gas = '1000' as any
    assertInvalid(tx, 'ContractUserDelete: invalid field Gas')
  })
})
