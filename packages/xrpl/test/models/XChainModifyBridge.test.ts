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
        LockingChainIssue: { currency: 'XRP' },
        IssuingChainDoor: 'r3kmLJN5D28dHuH8vZNUZpMC43pEHpaocV',
        IssuingChainIssue: { currency: 'XRP' },
      },
      Fee: '10',
      Flags: 0,
      MinAccountCreateAmount: '10000',
      Sequence: 1,
      SignatureReward: '1000',
      SigningPubKey:
        '0330E7FC9D56BB25D6893BA3F317AE5BCF33B3291BD63DB32654A313222F7FD020',
      TransactionType: 'XChainModifyBridge',
      TxnSignature:
        '30440220101BCA4B5B5A37C6F44480F9A34752C9AA8B2CDF5AD47E3CB424DEDC21C06DB702206EEB257E82A89B1F46A0A2C7F070B0BD181D980FF86FE4269E369F6FC7A27091',
    }
  })

  it(`verifies valid XChainModifyBridge`, function () {
    assert.doesNotThrow(() => validateXChainModifyBridge(tx))
    assert.doesNotThrow(() => validate(tx))
  })

  it(`verifies valid XChainModifyBridge w/o optional`, function () {
    delete tx.SignatureReward
    delete tx.MinAccountCreateAmount
    delete tx.Signature
    delete tx.PublicKey

    assert.doesNotThrow(() => validateXChainModifyBridge(tx))
    assert.doesNotThrow(() => validate(tx))
  })

  it(`throws w/ missing XChainBridge`, function () {
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
})
