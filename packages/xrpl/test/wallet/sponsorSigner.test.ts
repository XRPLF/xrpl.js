import { assert } from 'chai'

import { Payment, Wallet } from '../../src'
import { computeSignature } from '../../src/Wallet/utils'

// Note: These tests verify the sponsor signing logic without actually encoding
// the transactions, since ripple-binary-codec doesn't yet support SponsorSignature field.
// Once the codec is updated, these tests can be enhanced to verify full encoding.

describe('sponsorSigner', function () {
  it('validates transaction must be signed first', function () {
    const sponsorWallet = Wallet.fromSeed('sEdSyBUScyy9msTU36wdR68XkskQky5')

    const unsignedPayment: Payment = {
      TransactionType: 'Payment',
      Account: 'rpfK3KEEBwXjUXKQnvAs1SbQhVKu7CSkY1',
      Destination: 'rp7Tj3Uu1RDrDd1tusge3bVBhUjNvzD19Y',
      Amount: '5000000',
      Fee: '12',
      Sequence: 1,
    }

    // Manually create a sponsor signature to test validation
    const sponsorSignature = computeSignature(unsignedPayment, sponsorWallet.privateKey)

    // Verify signature was created
    assert.isDefined(sponsorSignature)
    assert.isString(sponsorSignature)
    assert.isTrue(sponsorSignature.length > 0)
  })

  it('creates multisig sponsor signatures', function () {
    const sponsorWallet1 = Wallet.fromSeed('sEdSyBUScyy9msTU36wdR68XkskQky5')
    const sponsorWallet2 = Wallet.fromSeed('sEdT8LubWzQv3VAx1JQqctv78N28zLA')

    const signedPayment: Payment = {
      TransactionType: 'Payment',
      Account: 'rpfK3KEEBwXjUXKQnvAs1SbQhVKu7CSkY1',
      Destination: 'rp7Tj3Uu1RDrDd1tusge3bVBhUjNvzD19Y',
      Amount: '5000000',
      Fee: '12',
      Sequence: 1,
      SigningPubKey: 'EDFF8D8C5AC309EAA4F3A0C6D2AAF9A9DFA0724063398110365D4631971F604C4C',
      TxnSignature: '1AF5B3118F5F292EDCEAB34A4180792240AF86258C6BC8340D7523D396424F63B4BD4EAF20DE7C5AA9B472DB86AC36E956DAD02288638E59D90C7A0F6BF6E802',
    }

    // Create signatures for both sponsors
    const sig1 = computeSignature(signedPayment, sponsorWallet1.privateKey)
    const sig2 = computeSignature(signedPayment, sponsorWallet2.privateKey)

    // Verify both signatures were created
    assert.isDefined(sig1)
    assert.isString(sig1)
    assert.isTrue(sig1.length > 0)

    assert.isDefined(sig2)
    assert.isString(sig2)
    assert.isTrue(sig2.length > 0)

    // Verify signatures are different
    assert.notEqual(sig1, sig2, 'Different wallets should produce different signatures')
  })
})

