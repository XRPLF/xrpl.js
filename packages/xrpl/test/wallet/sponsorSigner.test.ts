import { assert } from 'chai'

import { Payment, Wallet } from '../../src'
import {
  combineSponsorSigners,
  signAsSponsor,
} from '../../src/Wallet/sponsorSigner'

describe('sponsorSigner', function () {
  it('single sign', function () {
    const sponsorWallet = Wallet.fromSeed('sEdSyBUScyy9msTU36wdR68XkskQky5')

    const signedPayment = {
      TransactionType: 'Payment',
      Account: 'rpfK3KEEBwXjUXKQnvAs1SbQhVKu7CSkY1',
      Destination: 'rp7Tj3Uu1RDrDd1tusge3bVBhUjNvzD19Y',
      Amount: '5000000',
      Fee: '12',
      Sequence: 1,
      Sponsor: 'rJnQrhRTXutuSwtrwxshREe7J5FHwivrasP',
      SponsorFlags: 1,
      SigningPubKey:
        'EDFF8D8C5AC309EAA4F3A0C6D2AAF9A9DFA0724063398110365D4631971F604C4C',
      TxnSignature:
        '1AF5B3118F5F292EDCEAB34A4180792240AF86258C6BC8340D7523D396424F63B4BD4EAF20DE7C5AA9B472DB86AC36E956DAD02288638E59D90C7A0F6BF6E802',
    }

    const expectedPayment = {
      TransactionType: 'Payment',
      Account: 'rpfK3KEEBwXjUXKQnvAs1SbQhVKu7CSkY1',
      Destination: 'rp7Tj3Uu1RDrDd1tusge3bVBhUjNvzD19Y',
      Amount: '5000000',
      Fee: '12',
      Sequence: 1,
      Sponsor: 'rJnQrhRTXutuSwtrwxshREe7J5FHwivrasP',
      SponsorFlags: 1,
      SigningPubKey:
        'EDFF8D8C5AC309EAA4F3A0C6D2AAF9A9DFA0724063398110365D4631971F604C4C',
      TxnSignature:
        '1AF5B3118F5F292EDCEAB34A4180792240AF86258C6BC8340D7523D396424F63B4BD4EAF20DE7C5AA9B472DB86AC36E956DAD02288638E59D90C7A0F6BF6E802',
      SponsorSignature: {
        SigningPubKey:
          'ED5BCA1EBB814D44FFDA397EBFCCBD45C43FEFE346F7235339D1EBAE253A81B5C0',
        TxnSignature:
          'C15E9E041D37ABEC1C0CA105AA97CF76CD1E02DCA72C8BD8F4B954DF9E1C3663C6ADEE01DED5C40E2B868F66FCA12833AA4CF20AE4CB2B70672B382F57D16E02',
      },
    }

    // Test error: transaction not signed by account
    assert.throws(() => {
      signAsSponsor(sponsorWallet, {
        ...signedPayment,
        SigningPubKey: undefined,
        TxnSignature: undefined,
      } as Payment)
    }, 'Transaction must be first signed by the account.')

    // Test error: transaction already signed by sponsor
    assert.throws(() => {
      signAsSponsor(sponsorWallet, {
        ...signedPayment,
        SponsorSignature: {
          SigningPubKey: '',
          TxnSignature: '',
        },
      } as Payment)
    }, 'Transaction is already signed by the sponsor.')

    // Test error: missing SponsorFlags
    assert.throws(() => {
      signAsSponsor(sponsorWallet, {
        ...signedPayment,
        SponsorFlags: undefined,
      } as Payment)
    }, 'Transaction must have SponsorFlags field set before sponsor can sign.')

    // Test error: missing Sponsor field
    assert.throws(() => {
      signAsSponsor(sponsorWallet, {
        ...signedPayment,
        Sponsor: undefined,
      } as Payment)
    }, 'Transaction must have Sponsor field set before sponsor can sign.')

    // Test error: Sponsor field doesn't match wallet
    assert.throws(() => {
      signAsSponsor(sponsorWallet, {
        ...signedPayment,
        Sponsor: 'rN7n7otQDd6FczFgLdlqtyMVrn3HMfra5e',
      } as Payment)
    }, /Transaction Sponsor field .* does not match the signing wallet address/)

    // Test successful single signature
    const { tx: sponsorSignedTx } = signAsSponsor(
      sponsorWallet,
      signedPayment as Payment,
    )

    assert.deepEqual(sponsorSignedTx, expectedPayment as Payment)
  })

  it('multi sign', function () {
    const signerWallet1 = Wallet.fromSeed('sEdSyBUScyy9msTU36wdR68XkskQky5')
    const signerWallet2 = Wallet.fromSeed('sEdT8LubWzQv3VAx1JQqctv78N28zLA')

    const signedPayment = {
      TransactionType: 'Payment',
      Account: 'rpfK3KEEBwXjUXKQnvAs1SbQhVKu7CSkY1',
      Destination: 'rp7Tj3Uu1RDrDd1tusge3bVBhUjNvzD19Y',
      Amount: '5000000',
      Fee: '12',
      Sequence: 1,
      Sponsor: 'rJnQrhRTXutuSwtrwxshREe7J5FHwivrasP',
      SponsorFlags: 1,
      SigningPubKey:
        'EDFF8D8C5AC309EAA4F3A0C6D2AAF9A9DFA0724063398110365D4631971F604C4C',
      TxnSignature:
        '1AF5B3118F5F292EDCEAB34A4180792240AF86258C6BC8340D7523D396424F63B4BD4EAF20DE7C5AA9B472DB86AC36E956DAD02288638E59D90C7A0F6BF6E802',
    }

    const expectedMultiSignedPayment = {
      TransactionType: 'Payment',
      Account: 'rpfK3KEEBwXjUXKQnvAs1SbQhVKu7CSkY1',
      Destination: 'rp7Tj3Uu1RDrDd1tusge3bVBhUjNvzD19Y',
      Amount: '5000000',
      Fee: '12',
      Sequence: 1,
      Sponsor: 'rJnQrhRTXutuSwtrwxshREe7J5FHwivrasP',
      SponsorFlags: 1,
      SigningPubKey:
        'EDFF8D8C5AC309EAA4F3A0C6D2AAF9A9DFA0724063398110365D4631971F604C4C',
      TxnSignature:
        '1AF5B3118F5F292EDCEAB34A4180792240AF86258C6BC8340D7523D396424F63B4BD4EAF20DE7C5AA9B472DB86AC36E956DAD02288638E59D90C7A0F6BF6E802',
      SponsorSignature: {
        Signers: [
          {
            Signer: {
              Account: 'rJnQrhRTXutuSwtrwxshREe7J5FHwivrasP',
              SigningPubKey:
                'ED5BCA1EBB814D44FFDA397EBFCCBD45C43FEFE346F7235339D1EBAE253A81B5C0',
              TxnSignature:
                '8CC39603EDF4066C60BEBE6C27D1DAA4103F0AF3BEE1CD1C31DCF7AB34C1C7A48C7E3BC5E106DE9E7FF68FF1D2CE1E03CBFC8C08E1B4AE04DE59E68DC6F0660A',
            },
          },
          {
            Signer: {
              Account: 'rUfwLbeXR5i6N32MS8t3o8Ae17yfR9SWXy',
              SigningPubKey:
                'EDD23C5EDD46CAD348CAC5673281B1551DDAAD1CF4336E08FF3FA6DE1F90C1D39E',
              TxnSignature:
                '68A30F312D21AC6E10045A011D99B5A0D72F9EC450EA58D1E3E62A835BCC7EF7D45CB303313EA9B4F8867E4EA67
C3F2672CD44EDB0B4C6D34001F89DE0B',
            },
          },
        ],
      },
    }

    // Test error: no transactions to combine
    assert.throws(() => {
      combineSponsorSigners([])
    }, 'There are 0 transactions to combine.')

    // Sign with both wallets using multisign
    const { tx: tx1 } = signAsSponsor(signerWallet1, signedPayment as Payment, {
      multisign: true,
    })
    const { tx: tx2 } = signAsSponsor(signerWallet2, signedPayment as Payment, {
      multisign: true,
    })

    // Test error: transaction not signed by account
    assert.throws(() => {
      combineSponsorSigners([
        {
          ...tx1,
          SigningPubKey: undefined,
          TxnSignature: undefined,
        } as Payment,
      ])
    }, 'Transaction must be first signed by the account.')

    // Test error: missing Signers in SponsorSignature
    assert.throws(() => {
      combineSponsorSigners([
        {
          ...tx1,
          SponsorSignature: {
            SigningPubKey: 'test',
            TxnSignature: 'test',
          },
        } as Payment,
      ])
    }, 'SponsorSignature must have Signers.')

    // Test error: transactions are not the same
    assert.throws(() => {
      combineSponsorSigners([
        tx1 as Payment,
        {
          ...tx2,
          Amount: '6000000',
        } as Payment,
      ])
    }, 'Sponsor transactions are not the same.')

    // Test successful combination
    const { tx: combinedTx } = combineSponsorSigners([
      tx1 as Payment,
      tx2 as Payment,
    ])

    assert.deepEqual(combinedTx, expectedMultiSignedPayment as Payment)
  })
})
