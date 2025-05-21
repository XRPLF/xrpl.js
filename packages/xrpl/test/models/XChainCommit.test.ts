import { validateXChainCommit } from '../../src/models/transactions/XChainCommit'
import { assertTxIsValid, assertTxValidationError } from '../testUtils'

const assertValid = (tx: any): void => assertTxIsValid(tx, validateXChainCommit)
const assertInvalid = (tx: any, message: string): void =>
  assertTxValidationError(tx, validateXChainCommit, message)

/**
 * XChainCommit Transaction Verification Testing.
 *
 * Providing runtime verification testing for each specific transaction type.
 */
describe('XChainCommit', function () {
  let tx: any

  beforeEach(function () {
    tx = {
      Account: 'rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh',
      Amount: '10000',
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
      Sequence: 1,
      TransactionType: 'XChainCommit',
      XChainClaimID: '0000000000000001',
    } as any
  })

  it('verifies valid XChainCommit', function () {
    assertValid(tx)
  })

  it('throws w/ missing XChainBridge', function () {
    delete tx.XChainBridge

    assertInvalid(tx, 'XChainCommit: missing field XChainBridge')
  })

  it('throws w/ invalid XChainBridge', function () {
    tx.XChainBridge = { XChainDoor: 'test' }

    assertInvalid(tx, 'XChainCommit: invalid field XChainBridge')
  })

  it('throws w/ missing XChainClaimID', function () {
    delete tx.XChainClaimID

    assertInvalid(tx, 'XChainCommit: missing field XChainClaimID')
  })

  it('throws w/ invalid XChainClaimID', function () {
    tx.XChainClaimID = { currency: 'ETH' }

    assertInvalid(tx, 'XChainCommit: invalid field XChainClaimID')
  })

  it('throws w/ invalid OtherChainDestination', function () {
    tx.OtherChainDestination = 123

    assertInvalid(tx, 'XChainCommit: invalid field OtherChainDestination')
  })

  it('throws w/ missing Amount', function () {
    delete tx.Amount

    assertInvalid(tx, 'XChainCommit: missing field Amount')
  })

  it('throws w/ invalid Amount', function () {
    tx.Amount = { currency: 'ETH' }

    assertInvalid(tx, 'XChainCommit: invalid field Amount')
  })
})
