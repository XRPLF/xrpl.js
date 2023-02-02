import { assert } from 'chai'
import { validate, ValidationError } from 'xrpl-local'
import { validateXChainCommit } from 'xrpl-local/models/transactions/XChainCommit'

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
        LockingChainIssue: { currency: 'XRP' },
        IssuingChainDoor: 'r3kmLJN5D28dHuH8vZNUZpMC43pEHpaocV',
        IssuingChainIssue: { currency: 'XRP' },
      },
      Fee: '10',
      Flags: 2147483648,
      Sequence: 1,
      SigningPubKey:
        '0330E7FC9D56BB25D6893BA3F317AE5BCF33B3291BD63DB32654A313222F7FD020',
      TransactionType: 'XChainCommit',
      TxnSignature:
        '3043021F177323F0D93612C82A4393A99B23905A7E675753FD80C52997AFAB13F5F9D002203BFFAF457E90BDA65AABE8F8762BD96162FAD98A0C030CCD69B06EE9B12BBFFE',
      XChainClaimID: '0000000000000001',
    }
  })

  it(`verifies valid XChainCommit`, function () {
    assert.doesNotThrow(() => validateXChainCommit(tx))
    assert.doesNotThrow(() => validate(tx))
  })

  it(`throws w/ missing XChainBridge`, function () {
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

  it(`throws w/ missing XChainClaimID`, function () {
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

  it(`throws w/ missing Amount`, function () {
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
})
