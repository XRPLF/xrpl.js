import { validateXChainClaim } from '../../src/models/transactions/XChainClaim'
import { assertTxIsValid, assertTxValidationError } from '../testUtils'

const assertValid = (tx: any): void => assertTxIsValid(tx, validateXChainClaim)
const assertInvalid = (tx: any, message: string): void =>
  assertTxValidationError(tx, validateXChainClaim, message)

/**
 * XChainClaim Transaction Verification Testing.
 *
 * Providing runtime verification testing for each specific transaction type.
 */
describe('XChainClaim', function () {
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
      Destination: 'r3kmLJN5D28dHuH8vZNUZpMC43pEHpaocV',
      Fee: '10',
      Flags: 2147483648,
      Sequence: 1,
      TransactionType: 'XChainClaim',
      XChainClaimID: '0000000000000001',
    } as any
  })

  it('verifies valid XChainClaim', function () {
    assertValid(tx)
  })

  it('throws w/ missing XChainBridge', function () {
    delete tx.XChainBridge

    assertInvalid(tx, 'XChainClaim: missing field XChainBridge')
  })

  it('throws w/ invalid XChainBridge', function () {
    tx.XChainBridge = { XChainDoor: 'test' }

    assertInvalid(
      tx,
      'XChainClaim: invalid field XChainBridge, expected a valid XChainBridge object',
    )
  })

  it('throws w/ missing XChainClaimID', function () {
    delete tx.XChainClaimID

    assertInvalid(tx, 'XChainClaim: missing field XChainClaimID')
  })

  it('throws w/ invalid XChainClaimID', function () {
    tx.XChainClaimID = { currency: 'ETH' }

    assertInvalid(
      tx,
      'XChainClaim: invalid field XChainClaimID, expected a number or hex string',
    )
  })

  it('throws w/ missing Destination', function () {
    delete tx.Destination

    assertInvalid(tx, 'XChainClaim: missing field Destination')
  })

  it('throws w/ invalid Destination', function () {
    tx.Destination = 123

    assertInvalid(
      tx,
      'XChainClaim: invalid field Destination, expected a valid account address',
    )
  })

  it('throws w/ invalid DestinationTag', function () {
    tx.DestinationTag = 'number'

    assertInvalid(
      tx,
      'XChainClaim: invalid field DestinationTag, expected a valid number',
    )
  })

  it('throws w/ missing Amount', function () {
    delete tx.Amount

    assertInvalid(tx, 'XChainClaim: missing field Amount')
  })

  it('throws w/ invalid Amount', function () {
    tx.Amount = { currency: 'ETH' }

    assertInvalid(
      tx,
      'XChainClaim: invalid field Amount, expected a valid Amount',
    )
  })
})
