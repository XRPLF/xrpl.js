import { validateXChainModifyBridge } from '../../src/models/transactions/XChainModifyBridge'
import { assertTxIsValid, assertTxValidationError } from '../testUtils'

const assertValid = (tx: any): void =>
  assertTxIsValid(tx, validateXChainModifyBridge)
const assertInvalid = (tx: any, message: string): void =>
  assertTxValidationError(tx, validateXChainModifyBridge, message)

/**
 * XChainModifyBridge Transaction Verification Testing.
 *
 * Providing runtime verification testing for each specific transaction type.
 */
describe('XChainModifyBridge', function () {
  let tx: any

  beforeEach(function () {
    tx = {
      Account: 'rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh',
      XChainBridge: {
        LockingChainDoor: 'rGzx83BVoqTYbGn7tiVAnFw7cbxjin13jL',
        LockingChainIssue: {
          currency: 'XRP',
        },
        IssuingChainDoor: 'r3kmLJN5D28dHuH8vZNUZpMC43pEHpaocV',
        IssuingChainIssue: {
          currency: 'XRP',
        },
      },
      Fee: '10',
      Flags: 0,
      MinAccountCreateAmount: '10000',
      Sequence: 1,
      SignatureReward: '1000',
      TransactionType: 'XChainModifyBridge',
    } as any
  })

  it('verifies valid XChainModifyBridge', function () {
    assertValid(tx)
  })

  it('throws w/ missing XChainBridge', function () {
    delete tx.XChainBridge

    assertInvalid(tx, 'XChainModifyBridge: missing field XChainBridge')
  })

  it('throws w/ invalid XChainBridge', function () {
    tx.XChainBridge = { XChainDoor: 'test' }

    assertInvalid(tx, 'XChainModifyBridge: invalid field XChainBridge')
  })

  it('throws w/ invalid SignatureReward', function () {
    tx.SignatureReward = { currency: 'ETH' }

    assertInvalid(tx, 'XChainModifyBridge: invalid field SignatureReward')
  })

  it('throws w/ invalid MinAccountCreateAmount', function () {
    tx.MinAccountCreateAmount = { currency: 'ETH' }

    assertInvalid(
      tx,
      'XChainModifyBridge: invalid field MinAccountCreateAmount',
    )
  })
})
