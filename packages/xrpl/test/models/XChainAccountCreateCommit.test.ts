import { validateXChainAccountCreateCommit } from '../../src/models/transactions/XChainAccountCreateCommit'
import { assertTxIsValid, assertTxValidationError } from '../testUtils'

const assertValid = (tx: any): void =>
  assertTxIsValid(tx, validateXChainAccountCreateCommit)
const assertInvalid = (tx: any, message: string): void =>
  assertTxValidationError(tx, validateXChainAccountCreateCommit, message)

/**
 * XChainAccountCreateCommit Transaction Verification Testing.
 *
 * Providing runtime verification testing for each specific transaction type.
 */
describe('XChainAccountCreateCommit', function () {
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
      Amount: '1000000',
      Fee: '10',
      Flags: 2147483648,
      Destination: 'rGzx83BVoqTYbGn7tiVAnFw7cbxjin13jL',
      Sequence: 1,
      SignatureReward: '10000',
      TransactionType: 'XChainAccountCreateCommit',
    } as any
  })

  it('verifies valid XChainAccountCreateCommit', function () {
    assertValid(tx)
  })

  it('throws w/ missing XChainBridge', function () {
    delete tx.XChainBridge

    assertInvalid(tx, 'XChainAccountCreateCommit: missing field XChainBridge')
  })

  it('throws w/ invalid XChainBridge', function () {
    tx.XChainBridge = { XChainDoor: 'test' }

    assertInvalid(tx, 'XChainAccountCreateCommit: invalid field XChainBridge')
  })

  it('throws w/ missing SignatureReward', function () {
    delete tx.SignatureReward

    assertInvalid(
      tx,
      'XChainAccountCreateCommit: missing field SignatureReward',
    )
  })

  it('throws w/ invalid SignatureReward', function () {
    tx.SignatureReward = { currency: 'ETH' }

    assertInvalid(
      tx,
      'XChainAccountCreateCommit: invalid field SignatureReward',
    )
  })

  it('throws w/ missing Destination', function () {
    delete tx.Destination

    assertInvalid(tx, 'XChainAccountCreateCommit: missing field Destination')
  })

  it('throws w/ invalid Destination', function () {
    tx.Destination = 123

    assertInvalid(tx, 'XChainAccountCreateCommit: invalid field Destination')
  })

  it('throws w/ missing Amount', function () {
    delete tx.Amount

    assertInvalid(tx, 'XChainAccountCreateCommit: missing field Amount')
  })

  it('throws w/ invalid Amount', function () {
    tx.Amount = { currency: 'ETH' }

    assertInvalid(tx, 'XChainAccountCreateCommit: invalid field Amount')
  })
})
