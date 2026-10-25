import { ContractClawback } from '../../src/models/transactions'
import { validateContractClawback } from '../../src/models/transactions/contractClawback'
import { assertTxValidationError } from '../testUtils'

const assertInvalid = (tx: any, message: string): void =>
  assertTxValidationError(tx, validateContractClawback, message)

const DISABLED =
  'ContractClawback: disabled on this network (rippled returns temDISABLED for every ContractClawback)'

/**
 * ContractClawback Transaction Verification Testing.
 *
 * Providing runtime verification testing for each specific transaction type.
 */
describe('ContractClawback', function () {
  let tx: ContractClawback

  beforeEach(function () {
    tx = {
      TransactionType: 'ContractClawback',
      Account: 'rfmDuhDyLGgx94qiwf3YF8BUV5j6KSvE8',
      ContractAccount: 'rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh',
      Amount: {
        currency: 'USD',
        issuer: 'rfmDuhDyLGgx94qiwf3YF8BUV5j6KSvE8',
        value: '10',
      },
    }
  })

  it('throws temDISABLED for a well-formed ContractClawback', function () {
    assertInvalid(tx, DISABLED)
  })

  it('throws temDISABLED for MPT and XRP Amounts', function () {
    tx.Amount = {
      mpt_issuance_id: '0000012FFD9EE5DA93AC614B4DB94D7E0FCE415CA51BED47',
      value: '10',
    }
    assertInvalid(tx, DISABLED)
    tx.Amount = '1000'
    assertInvalid(tx, DISABLED)
  })

  it('throws w/ missing Amount', function () {
    delete (tx as any).Amount
    assertInvalid(tx, 'ContractClawback: missing field Amount')
  })

  it('throws w/ invalid Amount', function () {
    tx.Amount = 10 as any
    assertInvalid(tx, 'ContractClawback: invalid field Amount')
  })

  it('throws w/ invalid ContractAccount', function () {
    tx.ContractAccount = 'not an account'
    assertInvalid(tx, 'ContractClawback: invalid field ContractAccount')
  })
})
