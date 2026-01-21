import { validateXChainCreateBridge } from '../../src/models/transactions/XChainCreateBridge'
import { assertTxIsValid, assertTxValidationError } from '../testUtils'

const assertValid = (tx: any): void =>
  assertTxIsValid(tx, validateXChainCreateBridge)
const assertInvalid = (tx: any, message: string): void =>
  assertTxValidationError(tx, validateXChainCreateBridge, message)

/**
 * XChainCreateBridge Transaction Verification Testing.
 *
 * Providing runtime verification testing for each specific transaction type.
 */
describe('XChainCreateBridge', function () {
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
      TransactionType: 'XChainCreateBridge',
    } as any
  })

  it('verifies valid XChainCreateBridge', function () {
    assertValid(tx)
  })

  it('throws w/ missing XChainBridge', function () {
    delete tx.XChainBridge

    assertInvalid(tx, 'XChainCreateBridge: missing field XChainBridge')
  })

  it('throws w/ invalid XChainBridge', function () {
    tx.XChainBridge = { XChainDoor: 'test' }

    assertInvalid(tx, 'XChainCreateBridge: invalid field XChainBridge')
  })

  it('throws w/ missing SignatureReward', function () {
    delete tx.SignatureReward

    assertInvalid(tx, 'XChainCreateBridge: missing field SignatureReward')
  })

  it('throws w/ invalid SignatureReward', function () {
    tx.SignatureReward = { currency: 'ETH' }

    assertInvalid(tx, 'XChainCreateBridge: invalid field SignatureReward')
  })

  it('throws w/ invalid MinAccountCreateAmount', function () {
    tx.MinAccountCreateAmount = { currency: 'ETH' }

    assertInvalid(
      tx,
      'XChainCreateBridge: invalid field MinAccountCreateAmount',
    )
  })
})
