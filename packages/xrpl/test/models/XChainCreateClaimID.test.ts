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
        LockingChainIssue: { currency: 'XRP' },
        IssuingChainDoor: 'r3kmLJN5D28dHuH8vZNUZpMC43pEHpaocV',
        IssuingChainIssue: { currency: 'XRP' },
      },
      Fee: '10',
      Flags: 2147483648,
      OtherChainSource: 'rGzx83BVoqTYbGn7tiVAnFw7cbxjin13jL',
      Sequence: 1,
      SignatureReward: '10000',
      SigningPubKey:
        '0330E7FC9D56BB25D6893BA3F317AE5BCF33B3291BD63DB32654A313222F7FD020',
      TransactionType: 'XChainCreateClaimID',
      TxnSignature:
        '30440220247B20A1B9C48E21A374CB9B3E1FE2A7C528151868DF8D307E9FBE15237E531A02207C20C092DDCC525E583EF4AB7CB91E862A6DED19426997D3F0A2C84E2BE8C5DD',
    }
  })

  it(`verifies valid XChainCreateClaimID`, function () {
    assert.doesNotThrow(() => validateXChainCreateClaimID(tx))
    assert.doesNotThrow(() => validate(tx))
  })

  it(`throws w/ missing XChainBridge`, function () {
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

  it(`throws w/ missing SignatureReward`, function () {
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

  it(`throws w/ missing OtherChainSource`, function () {
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
})
