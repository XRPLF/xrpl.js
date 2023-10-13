import { assert } from 'chai'

import { validate, ValidationError } from '../../src'
import { validateXChainCommit } from '../../src/models/transactions/XChainCommit'

/**
 * XChainCommit Transaction Verification Testing.
 *
 * Providing runtime verification testing for each specific transaction type.
 */
describe('XChainCommit', function () {
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
      Fee: '10',
      Flags: 2147483648,
      Sequence: 1,
      TransactionType: 'XChainCommit',
      XChainClaimID: '0000000000000001',
    } as any
  })

  it('verifies valid XChainCommit', function () {
    assert.doesNotThrow(() => validateXChainCommit(tx))
    assert.doesNotThrow(() => validate(tx))
  })

  it('throws w/ missing XChainBridge', function () {
    delete tx.XChainBridge

    assert.throws(
      () => validateXChainCommit(tx),
      ValidationError,
      'XChainCommit: missing field XChainBridge',
    )
    assert.throws(
      () => validate(tx),
      ValidationError,
      'XChainCommit: missing field XChainBridge',
    )
  })

  it('throws w/ invalid XChainBridge', function () {
    tx.XChainBridge = { XChainDoor: 'test' }

    assert.throws(
      () => validateXChainCommit(tx),
      ValidationError,
      'XChainCommit: invalid field XChainBridge',
    )
    assert.throws(
      () => validate(tx),
      ValidationError,
      'XChainCommit: invalid field XChainBridge',
    )
  })

  it('throws w/ missing XChainClaimID', function () {
    delete tx.XChainClaimID

    assert.throws(
      () => validateXChainCommit(tx),
      ValidationError,
      'XChainCommit: missing field XChainClaimID',
    )
    assert.throws(
      () => validate(tx),
      ValidationError,
      'XChainCommit: missing field XChainClaimID',
    )
  })

  it('throws w/ invalid XChainClaimID', function () {
    tx.XChainClaimID = { currency: 'ETH' }

    assert.throws(
      () => validateXChainCommit(tx),
      ValidationError,
      'XChainCommit: invalid field XChainClaimID',
    )
    assert.throws(
      () => validate(tx),
      ValidationError,
      'XChainCommit: invalid field XChainClaimID',
    )
  })

  it('throws w/ invalid OtherChainDestination', function () {
    tx.OtherChainDestination = 123

    assert.throws(
      () => validateXChainCommit(tx),
      ValidationError,
      'XChainCommit: invalid field OtherChainDestination',
    )
    assert.throws(
      () => validate(tx),
      ValidationError,
      'XChainCommit: invalid field OtherChainDestination',
    )
  })

  it('throws w/ missing Amount', function () {
    delete tx.Amount

    assert.throws(
      () => validateXChainCommit(tx),
      ValidationError,
      'XChainCommit: missing field Amount',
    )
    assert.throws(
      () => validate(tx),
      ValidationError,
      'XChainCommit: missing field Amount',
    )
  })

  it('throws w/ invalid Amount', function () {
    tx.Amount = { currency: 'ETH' }

    assert.throws(
      () => validateXChainCommit(tx),
      ValidationError,
      'XChainCommit: invalid field Amount',
    )
    assert.throws(
      () => validate(tx),
      ValidationError,
      'XChainCommit: invalid field Amount',
    )
  })
})
