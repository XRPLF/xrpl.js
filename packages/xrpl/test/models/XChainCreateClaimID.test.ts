import { validateXChainCreateClaimID } from '../../src/models/transactions/XChainCreateClaimID'
import { assertTxIsValid, assertTxValidationError } from '../testUtils'

const assertValid = (tx: any): void =>
  assertTxIsValid(tx, validateXChainCreateClaimID)
const assertInvalid = (tx: any, message: string): void =>
  assertTxValidationError(tx, validateXChainCreateClaimID, message)

/**
 * XChainCreateClaimID Transaction Verification Testing.
 *
 * Providing runtime verification testing for each specific transaction type.
 */
describe('XChainCreateClaimID', function () {
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
      Flags: 2147483648,
      OtherChainSource: 'rGzx83BVoqTYbGn7tiVAnFw7cbxjin13jL',
      Sequence: 1,
      SignatureReward: '10000',
      TransactionType: 'XChainCreateClaimID',
    } as any
  })

  it('verifies valid XChainCreateClaimID', function () {
    assertValid(tx)
  })

  it('throws w/ missing XChainBridge', function () {
    delete tx.XChainBridge

    assertInvalid(tx, 'XChainCreateClaimID: missing field XChainBridge')
  })

  it('throws w/ invalid XChainBridge', function () {
    tx.XChainBridge = { XChainDoor: 'test' }

    assertInvalid(tx, 'XChainCreateClaimID: invalid field XChainBridge')
  })

  it('throws w/ missing SignatureReward', function () {
    delete tx.SignatureReward

    assertInvalid(tx, 'XChainCreateClaimID: missing field SignatureReward')
  })

  it('throws w/ invalid SignatureReward', function () {
    tx.SignatureReward = { currency: 'ETH' }

    assertInvalid(tx, 'XChainCreateClaimID: invalid field SignatureReward')
  })

  it('throws w/ missing OtherChainSource', function () {
    delete tx.OtherChainSource

    assertInvalid(tx, 'XChainCreateClaimID: missing field OtherChainSource')
  })

  it('throws w/ invalid OtherChainSource', function () {
    tx.OtherChainSource = 123

    assertInvalid(tx, 'XChainCreateClaimID: invalid field OtherChainSource')
  })
})
