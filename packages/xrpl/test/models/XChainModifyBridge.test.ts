import { assert } from 'chai'

import { validate, ValidationError } from '../../src'
import { validateXChainModifyBridge } from '../../src/models/transactions/XChainModifyBridge'

/**
 * XChainModifyBridge Transaction Verification Testing.
 *
 * Providing runtime verification testing for each specific transaction type.
 */
describe('XChainModifyBridge', function () {
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
      TransactionType: 'XChainModifyBridge',
    } as any
  })

  it('verifies valid XChainModifyBridge', function () {
    assert.doesNotThrow(() => validateXChainModifyBridge(tx))
    assert.doesNotThrow(() => validate(tx))
  })

  it('throws w/ missing XChainBridge', function () {
    delete tx.XChainBridge

    assert.throws(
      () => validateXChainModifyBridge(tx),
      ValidationError,
      'XChainModifyBridge: missing field XChainBridge',
    )
    assert.throws(
      () => validate(tx),
      ValidationError,
      'XChainModifyBridge: missing field XChainBridge',
    )
  })

  it('throws w/ invalid XChainBridge', function () {
    tx.XChainBridge = { XChainDoor: 'test' }

    assert.throws(
      () => validateXChainModifyBridge(tx),
      ValidationError,
      'XChainModifyBridge: invalid field XChainBridge',
    )
    assert.throws(
      () => validate(tx),
      ValidationError,
      'XChainModifyBridge: invalid field XChainBridge',
    )
  })

  it('throws w/ invalid SignatureReward', function () {
    tx.SignatureReward = { currency: 'ETH' }

    assert.throws(
      () => validateXChainModifyBridge(tx),
      ValidationError,
      'XChainModifyBridge: invalid field SignatureReward',
    )
    assert.throws(
      () => validate(tx),
      ValidationError,
      'XChainModifyBridge: invalid field SignatureReward',
    )
  })

  it('throws w/ invalid MinAccountCreateAmount', function () {
    tx.MinAccountCreateAmount = { currency: 'ETH' }

    assert.throws(
      () => validateXChainModifyBridge(tx),
      ValidationError,
      'XChainModifyBridge: invalid field MinAccountCreateAmount',
    )
    assert.throws(
      () => validate(tx),
      ValidationError,
      'XChainModifyBridge: invalid field MinAccountCreateAmount',
    )
  })
})
