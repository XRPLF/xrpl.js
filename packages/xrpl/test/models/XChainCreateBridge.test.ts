import { assert } from 'chai'

import { validate, ValidationError } from '../../src'
import { validateXChainCreateBridge } from '../../src/models/transactions/XChainCreateBridge'

/**
 * XChainCreateBridge Transaction Verification Testing.
 *
 * Providing runtime verification testing for each specific transaction type.
 */
describe('XChainCreateBridge', function () {
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
      Flags: 0,
      MinAccountCreateAmount: '10000',
      Sequence: 1,
      SignatureReward: '1000',
      TransactionType: 'XChainCreateBridge',
    } as any
  })

  it('verifies valid XChainCreateBridge', function () {
    assert.doesNotThrow(() => validateXChainCreateBridge(tx))
    assert.doesNotThrow(() => validate(tx))
  })

  it('throws w/ missing XChainBridge', function () {
    delete tx.XChainBridge

    assert.throws(
      () => validateXChainCreateBridge(tx),
      ValidationError,
      'XChainCreateBridge: missing field XChainBridge',
    )
    assert.throws(
      () => validate(tx),
      ValidationError,
      'XChainCreateBridge: missing field XChainBridge',
    )
  })

  it('throws w/ invalid XChainBridge', function () {
    tx.XChainBridge = { XChainDoor: 'test' }

    assert.throws(
      () => validateXChainCreateBridge(tx),
      ValidationError,
      'XChainCreateBridge: invalid field XChainBridge',
    )
    assert.throws(
      () => validate(tx),
      ValidationError,
      'XChainCreateBridge: invalid field XChainBridge',
    )
  })

  it('throws w/ missing SignatureReward', function () {
    delete tx.SignatureReward

    assert.throws(
      () => validateXChainCreateBridge(tx),
      ValidationError,
      'XChainCreateBridge: missing field SignatureReward',
    )
    assert.throws(
      () => validate(tx),
      ValidationError,
      'XChainCreateBridge: missing field SignatureReward',
    )
  })

  it('throws w/ invalid SignatureReward', function () {
    tx.SignatureReward = { currency: 'ETH' }

    assert.throws(
      () => validateXChainCreateBridge(tx),
      ValidationError,
      'XChainCreateBridge: invalid field SignatureReward',
    )
    assert.throws(
      () => validate(tx),
      ValidationError,
      'XChainCreateBridge: invalid field SignatureReward',
    )
  })

  it('throws w/ invalid MinAccountCreateAmount', function () {
    tx.MinAccountCreateAmount = { currency: 'ETH' }

    assert.throws(
      () => validateXChainCreateBridge(tx),
      ValidationError,
      'XChainCreateBridge: invalid field MinAccountCreateAmount',
    )
    assert.throws(
      () => validate(tx),
      ValidationError,
      'XChainCreateBridge: invalid field MinAccountCreateAmount',
    )
  })
})
