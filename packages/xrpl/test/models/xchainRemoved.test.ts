import { assert } from 'chai'

import { ValidationError, validate } from '../../src'
import { registerTransactionTypes } from '../registerTransactionTypes'

const XCHAIN_COMMIT = {
  Account: 'rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh',
  Amount: '10000',
  XChainBridge: {
    LockingChainDoor: 'rGzx83BVoqTYbGn7tiVAnFw7cbxjin13jL',
    LockingChainIssue: { currency: 'XRP' },
    IssuingChainDoor: 'r3kmLJN5D28dHuH8vZNUZpMC43pEHpaocV',
    IssuingChainIssue: { currency: 'XRP' },
  },
  Fee: '10',
  Sequence: 1,
  TransactionType: 'XChainCommit',
  XChainClaimID: '0000000000000001',
}

/**
 * XChain transactions, which alphanet generation 1 does not run.
 */
describe('XChain removed', function () {
  // Holds only on a tree whose definitions.json is the network's
  it('refuses XChainCommit as an unknown TransactionType', function () {
    assert.throws(
      () => validate({ ...XCHAIN_COMMIT }),
      ValidationError,
      'BaseTransaction: Unknown TransactionType XChainCommit',
    )
  })

  describe('with XChainCommit known to the codec', function () {
    registerTransactionTypes(['XChainCommit'])

    it('has no XChainCommit model', function () {
      assert.throws(
        () => validate({ ...XCHAIN_COMMIT }),
        ValidationError,
        'Invalid field TransactionType: XChainCommit',
      )
    })
  })
})
