import { assert } from 'chai'

import { Payment, SponsorFlags, TrustSet, Wallet } from '../../src'
import {
  addPreFundedSponsor,
  combineSponsorSigners,
  signAsSponsor,
} from '../../src/Wallet/sponsorSigner'

/* eslint-disable max-statements -- test file with many assertions */
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
      Sponsor: 'rBJMcbqnAaxcUeEPF7WiaoHCtFiTmga7un',
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
      Sponsor: 'rBJMcbqnAaxcUeEPF7WiaoHCtFiTmga7un',
      SponsorFlags: 1,
      SigningPubKey:
        'EDFF8D8C5AC309EAA4F3A0C6D2AAF9A9DFA0724063398110365D4631971F604C4C',
      TxnSignature:
        '1AF5B3118F5F292EDCEAB34A4180792240AF86258C6BC8340D7523D396424F63B4BD4EAF20DE7C5AA9B472DB86AC36E956DAD02288638E59D90C7A0F6BF6E802',
      SponsorSignature: {
        SigningPubKey:
          'EDD184F5FE58EC1375AB1CF17A3C5A12A8DEE89DD5228772D69E28EE37438FE59E',
        TxnSignature:
          'D78B844CCC7FCE1E3F983CD89783E2A8465AF10B38928F6A076EA4B4E833158E08B5F4FA16D06DEF443081EE3B7574A1F48EBC83B147F7F0CF41F93C294A7F0C',
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
        Sponsor: 'rpfK3KEEBwXjUXKQnvAs1SbQhVKu7CSkY1',
      } as Payment)
    }, /Transaction Sponsor field .* does not match the signing wallet address/u)

    // Test successful single signature
    const { tx: sponsorSignedTx } = signAsSponsor(
      sponsorWallet,
      signedPayment as Payment,
    )

    // Verify structure and key fields. Signatures are deterministic
    // (Ed25519), so the sponsor signature is pinned exactly below to catch any
    // regression in the fixCleanup3_4_0 sponsor signing prefix.
    assert.equal(
      sponsorSignedTx.TransactionType,
      expectedPayment.TransactionType,
    )
    assert.equal(sponsorSignedTx.Account, expectedPayment.Account)
    assert.equal(sponsorSignedTx.Destination, expectedPayment.Destination)
    assert.equal(sponsorSignedTx.Amount, expectedPayment.Amount)
    assert.equal(sponsorSignedTx.Fee, expectedPayment.Fee)
    assert.equal(sponsorSignedTx.Sponsor, expectedPayment.Sponsor)
    assert.equal(sponsorSignedTx.SponsorFlags, expectedPayment.SponsorFlags)
    assert.equal(sponsorSignedTx.SigningPubKey, expectedPayment.SigningPubKey)
    assert.equal(sponsorSignedTx.TxnSignature, expectedPayment.TxnSignature)

    // Verify SponsorSignature exists with correct structure
    assert.exists(sponsorSignedTx.SponsorSignature)
    const sponsorSig = sponsorSignedTx.SponsorSignature as {
      SigningPubKey: string
      TxnSignature: string
    }
    assert.equal(
      sponsorSig.SigningPubKey,
      expectedPayment.SponsorSignature.SigningPubKey,
    )
    assert.equal(
      sponsorSig.TxnSignature,
      expectedPayment.SponsorSignature.TxnSignature,
    )
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
      Sponsor: 'rBJMcbqnAaxcUeEPF7WiaoHCtFiTmga7un',
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
      Sponsor: 'rBJMcbqnAaxcUeEPF7WiaoHCtFiTmga7un',
      SponsorFlags: 1,
      SigningPubKey:
        'EDFF8D8C5AC309EAA4F3A0C6D2AAF9A9DFA0724063398110365D4631971F604C4C',
      TxnSignature:
        '1AF5B3118F5F292EDCEAB34A4180792240AF86258C6BC8340D7523D396424F63B4BD4EAF20DE7C5AA9B472DB86AC36E956DAD02288638E59D90C7A0F6BF6E802',
      SponsorSignature: {
        Signers: [
          {
            Signer: {
              Account: 'rBJMcbqnAaxcUeEPF7WiaoHCtFiTmga7un',
              SigningPubKey:
                'EDD184F5FE58EC1375AB1CF17A3C5A12A8DEE89DD5228772D69E28EE37438FE59E',
              TxnSignature:
                'E983F7BED3E129E93F3001567006FD12AA8E6B180DFD18E2293D998080E80F133E1D7142A36C30BCDDB67339EEE02449937A4DEA1500BF06E2803E29C1B76A05',
            },
          },
          {
            Signer: {
              Account: 'rKQhhSnRXJyqDq5BFtWG2E6zxAdq6wDyQC',
              SigningPubKey:
                'ED121AF03981F6496E47854955F65FC8763232D74EBF73877889514137BB72720A',
              TxnSignature:
                'D20FCEBBD96956CED0D34A3B720280C34E92C5CE94288E2FA61FFD30BAECAD0F76CC38D9ECE504DCA8F586B06CEA6A3D1966474541ED338EE569515860DA4800',
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
            SigningPubKey:
              'EDD184F5FE58EC1375AB1CF17A3C5A12A8DEE89DD5228772D69E28EE37438FE59E',
            TxnSignature:
              'E983F7BED3E129E93F3001567006FD12AA8E6B180DFD18E2293D998080E80F133E1D7142A36C30BCDDB67339EEE02449937A4DEA1500BF06E2803E29C1B76A05',
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

    // Verify structure. Signatures are deterministic (Ed25519), so each
    // sponsor signer's signature is pinned exactly below to catch any
    // regression in the fixCleanup3_4_0 sponsor multi-signing prefix.
    assert.equal(
      combinedTx.TransactionType,
      expectedMultiSignedPayment.TransactionType,
    )
    assert.equal(combinedTx.Account, expectedMultiSignedPayment.Account)
    assert.equal(combinedTx.Destination, expectedMultiSignedPayment.Destination)
    assert.equal(combinedTx.Amount, expectedMultiSignedPayment.Amount)
    assert.equal(combinedTx.Fee, expectedMultiSignedPayment.Fee)
    assert.equal(combinedTx.Sponsor, expectedMultiSignedPayment.Sponsor)
    assert.equal(
      combinedTx.SponsorFlags,
      expectedMultiSignedPayment.SponsorFlags,
    )
    assert.equal(
      combinedTx.SigningPubKey,
      expectedMultiSignedPayment.SigningPubKey,
    )
    assert.equal(
      combinedTx.TxnSignature,
      expectedMultiSignedPayment.TxnSignature,
    )

    // Verify SponsorSignature has Signers array with correct structure
    assert.exists(combinedTx.SponsorSignature)
    const sponsorSig = combinedTx.SponsorSignature as {
      Signers: Array<{
        Signer: { Account: string; SigningPubKey: string; TxnSignature: string }
      }>
    }
    assert.isArray(sponsorSig.Signers)
    assert.equal(sponsorSig.Signers.length, 2)

    // Verify each signer has correct structure and accounts
    const expectedSigners =
      expectedMultiSignedPayment.SponsorSignature.Signers.map(
        (signerEntry) => signerEntry.Signer.Account,
      )
    const actualSigners = sponsorSig.Signers.map(
      (signerEntry) => signerEntry.Signer.Account,
    )
    assert.sameMembers(actualSigners, expectedSigners)

    // Pin each signer's exact signature (matched by account, since
    // combineSponsorSigners sorts the Signers array).
    for (const signerEntry of sponsorSig.Signers) {
      const expectedSigner =
        expectedMultiSignedPayment.SponsorSignature.Signers.find(
          (entry) => entry.Signer.Account === signerEntry.Signer.Account,
        )
      assert.exists(expectedSigner)
      assert.equal(
        signerEntry.Signer.SigningPubKey,
        expectedSigner.Signer.SigningPubKey,
      )
      assert.equal(
        signerEntry.Signer.TxnSignature,
        expectedSigner.Signer.TxnSignature,
      )
    }
  })

  describe('addPreFundedSponsor', function () {
    it('adds Sponsor and SponsorFlags to transaction successfully', function () {
      const payment: Payment = {
        TransactionType: 'Payment',
        Account: 'rpfK3KEEBwXjUXKQnvAs1SbQhVKu7CSkY1',
        Destination: 'rp7Tj3Uu1RDrDd1tusge3bVBhUjNvzD19Y',
        Amount: '5000000',
        Fee: '12',
        Sequence: 1,
      }

      const sponsorAddress = 'rBJMcbqnAaxcUeEPF7WiaoHCtFiTmga7un'
      const sponsorFlags = SponsorFlags.spfSponsorFee

      const result = addPreFundedSponsor(payment, sponsorAddress, sponsorFlags)

      assert.equal(result.Sponsor, sponsorAddress)
      assert.equal(result.SponsorFlags, sponsorFlags)
      // Verify original transaction fields are preserved
      assert.equal(result.Account, payment.Account)
      assert.equal(result.Destination, payment.Destination)
      assert.equal(result.Amount, payment.Amount)
    })

    it('adds SponsorFlags for both fee and reserve', function () {
      const payment: Payment = {
        TransactionType: 'Payment',
        Account: 'rpfK3KEEBwXjUXKQnvAs1SbQhVKu7CSkY1',
        Destination: 'rp7Tj3Uu1RDrDd1tusge3bVBhUjNvzD19Y',
        Amount: '5000000',
        Fee: '12',
        Sequence: 1,
      }

      const sponsorAddress = 'rBJMcbqnAaxcUeEPF7WiaoHCtFiTmga7un'
      /* eslint-disable no-bitwise -- combining sponsor flags */
      const sponsorFlags =
        SponsorFlags.spfSponsorFee | SponsorFlags.spfSponsorReserve
      /* eslint-enable no-bitwise */

      const result = addPreFundedSponsor(payment, sponsorAddress, sponsorFlags)

      assert.equal(result.SponsorFlags, sponsorFlags)
      // Combined flags: spfSponsorFee (1) + spfSponsorReserve (2) = 3
      assert.equal(result.SponsorFlags, 3)
    })

    it('throws when Sponsor and Account are the same (self-sponsorship)', function () {
      const payment: Payment = {
        TransactionType: 'Payment',
        Account: 'rpfK3KEEBwXjUXKQnvAs1SbQhVKu7CSkY1',
        Destination: 'rp7Tj3Uu1RDrDd1tusge3bVBhUjNvzD19Y',
        Amount: '5000000',
        Fee: '12',
        Sequence: 1,
      }

      // Same as Account (self-sponsorship test)
      const sponsorAddress = payment.Account
      const sponsorFlags = SponsorFlags.spfSponsorFee

      assert.throws(() => {
        addPreFundedSponsor(payment, sponsorAddress, sponsorFlags)
      }, 'addPreFundedSponsor: Sponsor and Account cannot be the same (self-sponsorship not allowed)')
    })

    it('throws when SponsorFlags is 0', function () {
      const payment: Payment = {
        TransactionType: 'Payment',
        Account: 'rpfK3KEEBwXjUXKQnvAs1SbQhVKu7CSkY1',
        Destination: 'rp7Tj3Uu1RDrDd1tusge3bVBhUjNvzD19Y',
        Amount: '5000000',
        Fee: '12',
        Sequence: 1,
      }

      const sponsorAddress = 'rBJMcbqnAaxcUeEPF7WiaoHCtFiTmga7un'
      const sponsorFlags = 0

      assert.throws(() => {
        addPreFundedSponsor(payment, sponsorAddress, sponsorFlags)
      }, 'addPreFundedSponsor: SponsorFlags must have at least one flag set')
    })

    it('does not mutate the original transaction', function () {
      const payment: Payment = {
        TransactionType: 'Payment',
        Account: 'rpfK3KEEBwXjUXKQnvAs1SbQhVKu7CSkY1',
        Destination: 'rp7Tj3Uu1RDrDd1tusge3bVBhUjNvzD19Y',
        Amount: '5000000',
        Fee: '12',
        Sequence: 1,
      }

      const originalPayment = { ...payment }
      const sponsorAddress = 'rBJMcbqnAaxcUeEPF7WiaoHCtFiTmga7un'
      const sponsorFlags = SponsorFlags.spfSponsorFee

      addPreFundedSponsor(payment, sponsorAddress, sponsorFlags)

      // Verify original transaction is unchanged
      assert.deepEqual(payment, originalPayment)
      assert.isUndefined(payment.Sponsor)
      assert.isUndefined(payment.SponsorFlags)
    })

    it('works with different transaction types', function () {
      const trustSet: TrustSet = {
        TransactionType: 'TrustSet',
        Account: 'rpfK3KEEBwXjUXKQnvAs1SbQhVKu7CSkY1',
        LimitAmount: {
          currency: 'USD',
          issuer: 'rN7n7otQDd6FczFgLdlqtyMVrn3HMfra5e',
          value: '100',
        },
        Fee: '12',
        Sequence: 1,
      }

      const sponsorAddress = 'rBJMcbqnAaxcUeEPF7WiaoHCtFiTmga7un'
      const sponsorFlags = SponsorFlags.spfSponsorReserve

      const result = addPreFundedSponsor(trustSet, sponsorAddress, sponsorFlags)

      assert.equal(result.Sponsor, sponsorAddress)
      assert.equal(result.SponsorFlags, SponsorFlags.spfSponsorReserve)
      assert.equal(result.TransactionType, 'TrustSet')
    })
  })
})
/* eslint-enable max-statements */
