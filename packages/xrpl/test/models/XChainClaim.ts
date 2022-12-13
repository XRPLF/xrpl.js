import { assert } from 'chai'
import { validate, ValidationError } from 'xrpl-local'
import { validateXChainClaim } from 'xrpl-local/models/transactions/XChainClaim'

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
        LockingChainIssue: {currency: 'XRP'},
        IssuingChainDoor: 'r3kmLJN5D28dHuH8vZNUZpMC43pEHpaocV',
        IssuingChainIssue: {currency: 'XRP'},
      },
      Destination: 'r3kmLJN5D28dHuH8vZNUZpMC43pEHpaocV',
      Fee: '10',
      Flags: 2147483648,
      Sequence: 1,
      SigningPubKey:
        '0330E7FC9D56BB25D6893BA3F317AE5BCF33B3291BD63DB32654A313222F7FD020',
      TransactionType: 'XChainClaim',
      TxnSignature:
        '30440220445F7469FDA401787D9EE8A9B6E24DFF81E94F4C09FD311D2C0A58FCC02C684A022029E2EF34A5EA35F50D5BB57AC6320AD3AE12C13C8D1379B255A486D72CED142E',
      XChainClaimID: '0000000000000001',
    }
  })

  it(`verifies valid XChainClaim`, function () {
    assert.doesNotThrow(() => validateXChainClaim(tx))
    assert.doesNotThrow(() => validate(tx))
  })

  it(`throws w/ missing XChainBridge`, function () {
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

  it(`throws w/ missing XChainClaimID`, function () {
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

  it(`throws w/ missing Destination`, function () {
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

  it(`throws w/ missing Amount`, function () {
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
})
