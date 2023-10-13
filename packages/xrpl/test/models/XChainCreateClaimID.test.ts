import { assert } from 'chai'

import { validate, ValidationError } from '../../src'
import { validateXChainCreateClaimID } from '../../src/models/transactions/XChainCreateClaimID'

/**
 * XChainCreateClaimID Transaction Verification Testing.
 *
 * Providing runtime verification testing for each specific transaction type.
 */
describe('XChainCreateClaimID', function () {
  let tx

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
    assert.doesNotThrow(() => validateXChainCreateClaimID(tx))
    assert.doesNotThrow(() => validate(tx))
  })

  it('throws w/ missing XChainBridge', function () {
    delete tx.XChainBridge

    assert.throws(
      () => validateXChainCreateClaimID(tx),
      ValidationError,
      'XChainCreateClaimID: missing field XChainBridge',
    )
    assert.throws(
      () => validate(tx),
      ValidationError,
      'XChainCreateClaimID: missing field XChainBridge',
    )
  })

  it('throws w/ invalid XChainBridge', function () {
    tx.XChainBridge = { XChainDoor: 'test' }

    assert.throws(
      () => validateXChainCreateClaimID(tx),
      ValidationError,
      'XChainCreateClaimID: invalid field XChainBridge',
    )
    assert.throws(
      () => validate(tx),
      ValidationError,
      'XChainCreateClaimID: invalid field XChainBridge',
    )
  })

  it('throws w/ missing SignatureReward', function () {
    delete tx.SignatureReward

    assert.throws(
      () => validateXChainCreateClaimID(tx),
      ValidationError,
      'XChainCreateClaimID: missing field SignatureReward',
    )
    assert.throws(
      () => validate(tx),
      ValidationError,
      'XChainCreateClaimID: missing field SignatureReward',
    )
  })

  it('throws w/ invalid SignatureReward', function () {
    tx.SignatureReward = { currency: 'ETH' }

    assert.throws(
      () => validateXChainCreateClaimID(tx),
      ValidationError,
      'XChainCreateClaimID: invalid field SignatureReward',
    )
    assert.throws(
      () => validate(tx),
      ValidationError,
      'XChainCreateClaimID: invalid field SignatureReward',
    )
  })

  it('throws w/ missing OtherChainSource', function () {
    delete tx.OtherChainSource

    assert.throws(
      () => validateXChainCreateClaimID(tx),
      ValidationError,
      'XChainCreateClaimID: missing field OtherChainSource',
    )
    assert.throws(
      () => validate(tx),
      ValidationError,
      'XChainCreateClaimID: missing field OtherChainSource',
    )
  })

  it('throws w/ invalid OtherChainSource', function () {
    tx.OtherChainSource = 123

    assert.throws(
      () => validateXChainCreateClaimID(tx),
      ValidationError,
      'XChainCreateClaimID: invalid field OtherChainSource',
    )
    assert.throws(
      () => validate(tx),
      ValidationError,
      'XChainCreateClaimID: invalid field OtherChainSource',
    )
  })
})
