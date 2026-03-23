// Add one test for single signing and one test for multi-signing

import { assert } from 'chai'

import { LoanSet, Wallet } from '../../src'
import {
  combineLoanSetCounterpartySigners,
  signLoanSetByCounterparty,
} from '../../src/Wallet/counterpartySigner'

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
          '440B839B41834A9292B23A8DB547EA34DC89FC8313056C96812384A860848381C4F11867F1092594D3E263DB2433CEB07E2AD312944FF68F2E2EF995ABAE9C05',
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
                'C3A989FFA24CE21AE9E1734653387B34044A82B13F34B7B1175CB20118F9EF904ABEA691E4D3EFFD1EBF63C3B50F29AA89B68AF4A70CF74601CD326772D1680E',
              Account: 'rBJMcbqnAaxcUeEPF7WiaoHCtFiTmga7un',
            },
          },
          {
            Signer: {
              SigningPubKey:
                'ED121AF03981F6496E47854955F65FC8763232D74EBF73877889514137BB72720A',
              TxnSignature:
                '3A3D91798FCF56289BBF53A97D0CB07CFB5050CFBA05451A1C9A3A9E370AE81DCC3134E6CC35579ACA8937F15DF358DAB728054AC17C3858177C6947C1E21806',
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
})
