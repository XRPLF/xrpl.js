import { assert } from 'chai'

import { validate, ValidationError } from '../../src'
import { validateXChainClaim } from '../../src/models/transactions/XChainClaim'

/**
 * XChainClaim Transaction Verification Testing.
 *
 * Providing runtime verification testing for each specific transaction type.
 */
describe('XChainClaim', function () {
  let tx

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
    assert.doesNotThrow(() => validateXChainClaim(tx))
    assert.doesNotThrow(() => validate(tx))
  })

  it('throws w/ missing XChainBridge', function () {
    delete tx.XChainBridge

    assert.throws(
      () => validateXChainClaim(tx),
      ValidationError,
      'XChainClaim: missing field XChainBridge',
    )
    assert.throws(
      () => validate(tx),
      ValidationError,
      'XChainClaim: missing field XChainBridge',
    )
  })

  it('throws w/ invalid XChainBridge', function () {
    tx.XChainBridge = { XChainDoor: 'test' }

    assert.throws(
      () => validateXChainClaim(tx),
      ValidationError,
      'XChainClaim: invalid field XChainBridge',
    )
    assert.throws(
      () => validate(tx),
      ValidationError,
      'XChainClaim: invalid field XChainBridge',
    )
  })

  it('throws w/ missing XChainClaimID', function () {
    delete tx.XChainClaimID

    assert.throws(
      () => validateXChainClaim(tx),
      ValidationError,
      'XChainClaim: missing field XChainClaimID',
    )
    assert.throws(
      () => validate(tx),
      ValidationError,
      'XChainClaim: missing field XChainClaimID',
    )
  })

  it('throws w/ invalid XChainClaimID', function () {
    tx.XChainClaimID = { currency: 'ETH' }

    assert.throws(
      () => validateXChainClaim(tx),
      ValidationError,
      'XChainClaim: invalid field XChainClaimID',
    )
    assert.throws(
      () => validate(tx),
      ValidationError,
      'XChainClaim: invalid field XChainClaimID',
    )
  })

  it('throws w/ missing Destination', function () {
    delete tx.Destination

    assert.throws(
      () => validateXChainClaim(tx),
      ValidationError,
      'XChainClaim: missing field Destination',
    )
    assert.throws(
      () => validate(tx),
      ValidationError,
      'XChainClaim: missing field Destination',
    )
  })

  it('throws w/ invalid Destination', function () {
    tx.Destination = 123

    assert.throws(
      () => validateXChainClaim(tx),
      ValidationError,
      'XChainClaim: invalid field Destination',
    )
    assert.throws(
      () => validate(tx),
      ValidationError,
      'XChainClaim: invalid field Destination',
    )
  })

  it('throws w/ invalid DestinationTag', function () {
    tx.DestinationTag = 'number'

    assert.throws(
      () => validateXChainClaim(tx),
      ValidationError,
      'XChainClaim: invalid field DestinationTag',
    )
    assert.throws(
      () => validate(tx),
      ValidationError,
      'XChainClaim: invalid field DestinationTag',
    )
  })

  it('throws w/ missing Amount', function () {
    delete tx.Amount

    assert.throws(
      () => validateXChainClaim(tx),
      ValidationError,
      'XChainClaim: missing field Amount',
    )
    assert.throws(
      () => validate(tx),
      ValidationError,
      'XChainClaim: missing field Amount',
    )
  })

  it('throws w/ invalid Amount', function () {
    tx.Amount = { currency: 'ETH' }

    assert.throws(
      () => validateXChainClaim(tx),
      ValidationError,
      'XChainClaim: invalid field Amount',
    )
    assert.throws(
      () => validate(tx),
      ValidationError,
      'XChainClaim: invalid field Amount',
    )
  })
})
