// Add one test for single signing and one test for multi-signing

import { assert } from 'chai'
import {
  decode,
  encodeForMultisigningCounterparty,
  encodeForSigningCounterparty,
  XrplDefinitions,
} from 'ripple-binary-codec'
import normalDefinitionsJson from 'ripple-binary-codec/dist/enums/definitions.json'
import { type JsonObject } from 'ripple-binary-codec/dist/types/serialized-type'
import { verify } from 'ripple-keypairs'

import { AccountSet, FirewallSet, LoanSet, Wallet } from '../../src'
import { hashSignedTx } from '../../src/utils/hashes'
import {
  combineCounterpartySigners,
  combineLoanSetCounterpartySigners,
  signByCounterparty,
  signLoanSetByCounterparty,
} from '../../src/Wallet/counterpartySigner'

/**
 * The bundled definitions, passed explicitly to exercise the `definitions` option.
 *
 * @returns The definitions.
 */
function firewallDefinitions(): XrplDefinitions {
  return new XrplDefinitions(normalDefinitionsJson)
}

const FIREWALL_ID =
  'E6DBAFC99223B42257915A63DFC6B0C032D4070F9A574B255AD97466726FC321'
const FIRST_PARTY_SIGNATURE = {
  SigningPubKey:
    'EDFF8D8C5AC309EAA4F3A0C6D2AAF9A9DFA0724063398110365D4631971F604C4C',
  TxnSignature:
    '1AF5B3118F5F292EDCEAB34A4180792240AF86258C6BC8340D7523D396424F63B4BD4EAF20DE7C5AA9B472DB86AC36E956DAD02288638E59D90C7A0F6BF6E802',
}

describe('counterpartySigner', function () {
  it('single sign', function () {
    const borrowerWallet = Wallet.fromSeed('sEd7FqVHfNZ2UdGAwjssxPev2ujwJoT')
    const singedLoanSet = {
      TransactionType: 'LoanSet',
      Flags: 0,
      Sequence: 1702,
      LastLedgerSequence: 1725,
      PaymentTotal: 1,
      LoanBrokerID:
        '033D9B59DBDC4F48FB6708892E7DB0E8FBF9710C3A181B99D9FAF7B9C82EF077',
      Fee: '480',
      Account: 'rpfK3KEEBwXjUXKQnvAs1SbQhVKu7CSkY1',
      Counterparty: 'rp7Tj3Uu1RDrDd1tusge3bVBhUjNvzD19Y',
      PrincipalRequested: '5000000',
    }

    const expectedLoanSet = {
      TransactionType: 'LoanSet',
      Flags: 0,
      Sequence: 1702,
      LastLedgerSequence: 1725,
      PaymentTotal: 1,
      LoanBrokerID:
        '033D9B59DBDC4F48FB6708892E7DB0E8FBF9710C3A181B99D9FAF7B9C82EF077',
      Fee: '480',
      SigningPubKey:
        'EDFF8D8C5AC309EAA4F3A0C6D2AAF9A9DFA0724063398110365D4631971F604C4C',
      TxnSignature:
        '1AF5B3118F5F292EDCEAB34A4180792240AF86258C6BC8340D7523D396424F63B4BD4EAF20DE7C5AA9B472DB86AC36E956DAD02288638E59D90C7A0F6BF6E802',
      Account: 'rpfK3KEEBwXjUXKQnvAs1SbQhVKu7CSkY1',
      Counterparty: 'rp7Tj3Uu1RDrDd1tusge3bVBhUjNvzD19Y',
      PrincipalRequested: '5000000',
      CounterpartySignature: {
        SigningPubKey:
          'ED1139D765C2C8F175153EE663D2CBE574685D5FCF61A6A33DF7AC72C9903D3F94',
        TxnSignature:
          '2C0D70281D70E40EAF54C12E21823BE3838426F4EF34E391FA28B2B226669647FFF8D5771D37F43741136555006CCB269CF8ED983748ADB22F09148F02578107',
      },
    }

    assert.throws(() => {
      signLoanSetByCounterparty(borrowerWallet, singedLoanSet as LoanSet)
    }, 'Transaction must be first signed by first party.')

    assert.throws(() => {
      signLoanSetByCounterparty(borrowerWallet, {
        ...singedLoanSet,
        TransactionType: 'Payment',
      } as unknown as LoanSet)
    }, 'Transaction must be a LoanSet transaction.')

    assert.throws(() => {
      signLoanSetByCounterparty(borrowerWallet, {
        ...singedLoanSet,
        CounterpartySignature: {
          SigningPubKey: '',
          TxnSignature: '',
        },
      } as LoanSet)
    }, 'Transaction is already signed by the counterparty.')

    const { tx: borrowerSignedTx } = signLoanSetByCounterparty(borrowerWallet, {
      ...singedLoanSet,
      TxnSignature:
        '1AF5B3118F5F292EDCEAB34A4180792240AF86258C6BC8340D7523D396424F63B4BD4EAF20DE7C5AA9B472DB86AC36E956DAD02288638E59D90C7A0F6BF6E802',
      SigningPubKey:
        'EDFF8D8C5AC309EAA4F3A0C6D2AAF9A9DFA0724063398110365D4631971F604C4C',
    } as LoanSet)

    assert.deepEqual(borrowerSignedTx, expectedLoanSet as LoanSet)
  })

  it('multi sign', function () {
    const signerWallet1 = Wallet.fromSeed('sEdSyBUScyy9msTU36wdR68XkskQky5')
    const signerWallet2 = Wallet.fromSeed('sEdT8LubWzQv3VAx1JQqctv78N28zLA')

    const singedLoanSet = {
      TransactionType: 'LoanSet',
      Flags: 0,
      Sequence: 1807,
      LastLedgerSequence: 1838,
      PaymentTotal: 1,
      InterestRate: 0,
      LoanBrokerID:
        'D1902EFBFF8C6536322D48B9F3B974AEC29AC826CF6BEA6218C886581A712AFE',
      Fee: '720',
      SigningPubKey:
        'EDE7E70883C11FFDEB28A1FEDA20C89352E3FCFEAABFF9EF890A08664E5687ECD2',
      TxnSignature:
        '0438178AF327FC54C42638A4EDB0EB9A701B2D6192388BE8A4C7A61DD82EA4510D10C0CADAD3D8A7EBC7B08C3F2A50F12F686B47ED2562EE6792434322E94B0E',
      Account: 'rpmFCkiUFiufA3HdLagJCWGbzByaQLJKKJ',
      Counterparty: 'rQnFUSfgnLNA2KzvKUjRX69tbv7WX76UXW',
      PrincipalRequested: '100000',
    }

    const expectedLoanSet = {
      TransactionType: 'LoanSet',
      Flags: 0,
      Sequence: 1807,
      LastLedgerSequence: 1838,
      PaymentTotal: 1,
      InterestRate: 0,
      LoanBrokerID:
        'D1902EFBFF8C6536322D48B9F3B974AEC29AC826CF6BEA6218C886581A712AFE',
      Fee: '720',
      SigningPubKey:
        'EDE7E70883C11FFDEB28A1FEDA20C89352E3FCFEAABFF9EF890A08664E5687ECD2',
      TxnSignature:
        '0438178AF327FC54C42638A4EDB0EB9A701B2D6192388BE8A4C7A61DD82EA4510D10C0CADAD3D8A7EBC7B08C3F2A50F12F686B47ED2562EE6792434322E94B0E',
      Account: 'rpmFCkiUFiufA3HdLagJCWGbzByaQLJKKJ',
      Counterparty: 'rQnFUSfgnLNA2KzvKUjRX69tbv7WX76UXW',
      PrincipalRequested: '100000',
      CounterpartySignature: {
        Signers: [
          {
            Signer: {
              SigningPubKey:
                'EDD184F5FE58EC1375AB1CF17A3C5A12A8DEE89DD5228772D69E28EE37438FE59E',
              TxnSignature:
                'BDF36CEDBC8151619D8C3A2452D5775B744C0BB04722F757FB88EA744D18A5DED875F72009B92ED5039422FF0FFEC7CF635310910ED1D0623D24CE27AFDB6401',
              Account: 'rBJMcbqnAaxcUeEPF7WiaoHCtFiTmga7un',
            },
          },
          {
            Signer: {
              SigningPubKey:
                'ED121AF03981F6496E47854955F65FC8763232D74EBF73877889514137BB72720A',
              TxnSignature:
                '3743ADC994FDAC886627FE12D3C8D5AA6F300F8903E2148D11A78E752D48C5B4CFF3A106BFE0019B661246BA9E33AFF37E060B4872812F8D79D9871DE4C56C04',
              Account: 'rKQhhSnRXJyqDq5BFtWG2E6zxAdq6wDyQC',
            },
          },
        ],
      },
    }

    const { tx: signer1SignedTx } = signLoanSetByCounterparty(
      signerWallet1,
      singedLoanSet as LoanSet,
      { multisign: true },
    )

    const { tx: signer2SignedTx } = signLoanSetByCounterparty(
      signerWallet2,
      singedLoanSet as LoanSet,
      { multisign: true },
    )

    assert.throws(() => {
      combineLoanSetCounterpartySigners([])
    }, 'There are 0 transactions to combine.')

    const { tx: combinedSignedTx } = combineLoanSetCounterpartySigners([
      signer1SignedTx,
      signer2SignedTx,
    ])

    assert.deepEqual(combinedSignedTx, expectedLoanSet as LoanSet)
  })

  describe('Firewall transactions', function () {
    const definitions = firewallDefinitions()
    const counterpartyWallet = Wallet.fromSeed(
      'sEd7FqVHfNZ2UdGAwjssxPev2ujwJoT',
    )
    const firewallDelete = {
      TransactionType: 'FirewallDelete',
      Account: 'rpfK3KEEBwXjUXKQnvAs1SbQhVKu7CSkY1',
      Fee: '24',
      Sequence: 7,
      FirewallID: FIREWALL_ID,
      ...FIRST_PARTY_SIGNATURE,
    }

    it('signs a FirewallDelete as the counterparty', function () {
      const { tx, tx_blob, hash } = signByCounterparty(
        counterpartyWallet,
        firewallDelete,
        { definitions },
      )
      const signature = tx.CounterpartySignature
      assert.equal(signature?.SigningPubKey, counterpartyWallet.publicKey)
      assert.isTrue(
        verify(
          encodeForSigningCounterparty(
            tx as unknown as JsonObject,
            definitions,
          ),
          signature?.TxnSignature ?? '',
          counterpartyWallet.publicKey,
        ),
      )
      assert.deepEqual(
        decode(tx_blob, definitions),
        tx as unknown as JsonObject,
      )
      assert.equal(hash, hashSignedTx(tx_blob, definitions))
    })

    it('signs a FirewallSet update as the counterparty', function () {
      const firewallSet: FirewallSet = {
        TransactionType: 'FirewallSet',
        Account: 'rpfK3KEEBwXjUXKQnvAs1SbQhVKu7CSkY1',
        Fee: '24',
        Sequence: 8,
        FirewallID: FIREWALL_ID,
        MaxFee: '1000',
        ...FIRST_PARTY_SIGNATURE,
      }
      const { tx } = signByCounterparty(counterpartyWallet, firewallSet, {
        definitions,
      })
      assert.isTrue(
        verify(
          encodeForSigningCounterparty(
            tx as unknown as JsonObject,
            definitions,
          ),
          tx.CounterpartySignature?.TxnSignature ?? '',
          counterpartyWallet.publicKey,
        ),
      )
    })

    it('refuses a FirewallSet that creates a firewall', function () {
      const create: FirewallSet = {
        TransactionType: 'FirewallSet',
        Account: 'rpfK3KEEBwXjUXKQnvAs1SbQhVKu7CSkY1',
        Counterparty: 'rp7Tj3Uu1RDrDd1tusge3bVBhUjNvzD19Y',
        Backup: 'rQnFUSfgnLNA2KzvKUjRX69tbv7WX76UXW',
        Fee: '12',
        Sequence: 6,
        ...FIRST_PARTY_SIGNATURE,
      }
      assert.throws(
        () => signByCounterparty(counterpartyWallet, create, { definitions }),
        'FirewallSet: CounterpartySignature is not allowed to create a firewall',
      )
    })

    it('multi-signs and combines a WithdrawPreauth', function () {
      const signerWallet1 = Wallet.fromSeed('sEdSyBUScyy9msTU36wdR68XkskQky5')
      const signerWallet2 = Wallet.fromSeed('sEdT8LubWzQv3VAx1JQqctv78N28zLA')
      const withdrawPreauth = {
        TransactionType: 'WithdrawPreauth',
        Account: 'rpfK3KEEBwXjUXKQnvAs1SbQhVKu7CSkY1',
        Authorize: 'rp7Tj3Uu1RDrDd1tusge3bVBhUjNvzD19Y',
        Fee: '36',
        Sequence: 9,
        FirewallID: FIREWALL_ID,
        ...FIRST_PARTY_SIGNATURE,
      }
      const signed = [signerWallet1, signerWallet2].map(
        (wallet) =>
          signByCounterparty(wallet, withdrawPreauth, {
            multisign: true,
            definitions,
          }).tx,
      )
      const { tx, tx_blob } = combineCounterpartySigners(signed, definitions)
      const signers = tx.CounterpartySignature?.Signers ?? []
      assert.lengthOf(signers, 2)
      signers.forEach(({ Signer: signer }) => {
        assert.isTrue(
          verify(
            encodeForMultisigningCounterparty(
              tx as unknown as JsonObject,
              signer.Account,
              definitions,
            ),
            signer.TxnSignature,
            signer.SigningPubKey,
          ),
        )
      })
      assert.deepEqual(
        decode(tx_blob, definitions),
        tx as unknown as JsonObject,
      )
    })

    it('refuses to combine different transactions', function () {
      const signerWallet = Wallet.fromSeed('sEdSyBUScyy9msTU36wdR68XkskQky5')
      const first = signByCounterparty(signerWallet, firewallDelete, {
        multisign: true,
        definitions,
      }).tx
      const second = signByCounterparty(
        signerWallet,
        { ...firewallDelete, Sequence: 99 },
        { multisign: true, definitions },
      ).tx
      assert.throws(
        () => combineCounterpartySigners([first, second], definitions),
        'FirewallDelete transactions are not the same.',
      )
    })

    it('refuses a transaction type without a CounterpartySignature', function () {
      const accountSet: AccountSet = {
        TransactionType: 'AccountSet',
        Account: 'rpfK3KEEBwXjUXKQnvAs1SbQhVKu7CSkY1',
        ...FIRST_PARTY_SIGNATURE,
      }
      assert.throws(
        () => signByCounterparty(counterpartyWallet, accountSet),
        'Transaction type AccountSet does not carry a CounterpartySignature.',
      )
    })
  })
})
