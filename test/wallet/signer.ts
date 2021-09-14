import { assert } from 'chai'
import { decode, encode } from 'ripple-binary-codec/dist'
import { JsonObject } from 'ripple-binary-codec/dist/types/serialized-type'

import { Transaction } from 'xrpl-local'

import { ValidationError } from '../../src/common/errors'
import Wallet from '../../src/wallet'
import {
  sign,
  authorizeChannel,
  multisign,
  verifySignature,
} from '../../src/wallet/signer'
import requests from '../fixtures/requests'
import responses from '../fixtures/responses'

const { sign: REQUEST_FIXTURES } = requests
const { sign: RESPONSE_FIXTURES } = responses

const publicKey =
  '030E58CDD076E798C84755590AAF6237CA8FAE821070A59F648B517A30DC6F589D'
const privateKey =
  '00141BA006D3363D2FB2785E8DF4E44D3A49908780CB4FB51F6D217C08C021429F'
const address = 'rhvh5SrgBL5V8oeV9EpDuVszeJSSCEkbPc'
const seed = 'ss1x3KLrSvfg7irFc1D929WXZ7z9H'
const wallet = Wallet.fromSeed(seed)
const wallet2 = Wallet.fromSeed('shsWGZcmZz6YsWWmcnpfr6fLTdtFV')
const wallet3 = new Wallet(
  '02F89EAEC7667B30F33D0687BBA86C3FE2A08CCA40A9186C5BDE2DAA6FA97A37D8',
  '00ACCD3309DB14D1A4FC9B1DAE608031F4408C85C73EE05E035B7DC8B25840107A',
)

const verifyWallet = new Wallet(publicKey, privateKey)

const tx: Transaction = {
  TransactionType: 'Payment',
  Account: address,
  Destination: 'rQ3PTWGLCbPz8ZCicV5tCX3xuymojTng5r',
  Amount: '20000000',
  Sequence: 1,
  Fee: '12',
  SigningPubKey: publicKey,
}

const unsignedTx1: Transaction = {
  TransactionType: 'TrustSet',
  Account: 'rEuLyBCvcw4CFmzv8RepSiAoNgF8tTGJQC',
  Fee: '30000',
  Flags: 262144,
  LimitAmount: {
    currency: 'USD',
    issuer: 'rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh',
    value: '100',
  },
  Sequence: 2,
}

const unsignedSecret1 = 'spzGHmohX9bAM6gzF4m9FvJmJb1CR'

const multisignTx1: Transaction = {
  TransactionType: 'TrustSet',
  Account: 'rEuLyBCvcw4CFmzv8RepSiAoNgF8tTGJQC',
  Fee: '30000',
  Flags: 262144,
  LimitAmount: {
    currency: 'USD',
    issuer: 'rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh',
    value: '100',
  },
  Sequence: 2,
  Signers: [
    {
      Signer: {
        Account: 'rJvuSQhQR37czfxRou4vNWaM97uEhT4ShE',
        SigningPubKey:
          '02B78EEA571B2633180834CC6E7B4ED84FBF6811D12ECB59410E0C92D13B7726F5',
        TxnSignature:
          '304502210098009CEFA61EE9843BB7FC29B78CFFAACF28352A4A7CF3AAE79EF12D79BA50910220684F116266E5E4519A7A33F7421631EB8494082BE51A8B03FECCB3E59F77154A',
      },
    },
  ],
  SigningPubKey: '',
}

const multisignTxToCombine1: Transaction = {
  Account: 'rEuLyBCvcw4CFmzv8RepSiAoNgF8tTGJQC',
  Fee: '30000',
  Flags: 262144,
  LimitAmount: {
    currency: 'USD',
    issuer: 'rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh',
    value: '100',
  },
  Sequence: 2,
  Signers: [
    {
      Signer: {
        Account: 'rsA2LpzuawewSBQXkiju3YQTMzW13pAAdW',
        SigningPubKey:
          '02B3EC4E5DD96029A647CFA20DA07FE1F85296505552CCAC114087E66B46BD77DF',
        TxnSignature:
          '30450221009C195DBBF7967E223D8626CA19CF02073667F2B22E206727BFE848FF42BEAC8A022048C323B0BED19A988BDBEFA974B6DE8AA9DCAE250AA82BBD1221787032A864E5',
      },
    },
  ],
  SigningPubKey: '',
  TransactionType: 'TrustSet',
}

const multisignTxToCombine2: Transaction = {
  Account: 'rEuLyBCvcw4CFmzv8RepSiAoNgF8tTGJQC',
  Fee: '30000',
  Flags: 262144,
  LimitAmount: {
    currency: 'USD',
    issuer: 'rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh',
    value: '100',
  },
  Sequence: 2,
  Signers: [
    {
      Signer: {
        Account: 'rJvuSQhQR37czfxRou4vNWaM97uEhT4ShE',
        SigningPubKey:
          '02B78EEA571B2633180834CC6E7B4ED84FBF6811D12ECB59410E0C92D13B7726F5',
        TxnSignature:
          '304502210098009CEFA61EE9843BB7FC29B78CFFAACF28352A4A7CF3AAE79EF12D79BA50910220684F116266E5E4519A7A33F7421631EB8494082BE51A8B03FECCB3E59F77154A',
      },
    },
  ],
  SigningPubKey: '',
  TransactionType: 'TrustSet',
}

const expectedMultisign: string = encode({
  Account: 'rEuLyBCvcw4CFmzv8RepSiAoNgF8tTGJQC',
  Fee: '30000',
  Flags: 262144,
  LimitAmount: {
    currency: 'USD',
    issuer: 'rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh',
    value: '100',
  },
  Sequence: 2,
  Signers: [
    {
      Signer: {
        Account: 'rsA2LpzuawewSBQXkiju3YQTMzW13pAAdW',
        SigningPubKey:
          '02B3EC4E5DD96029A647CFA20DA07FE1F85296505552CCAC114087E66B46BD77DF',
        TxnSignature:
          '30450221009C195DBBF7967E223D8626CA19CF02073667F2B22E206727BFE848FF42BEAC8A022048C323B0BED19A988BDBEFA974B6DE8AA9DCAE250AA82BBD1221787032A864E5',
      },
    },
    {
      Signer: {
        Account: 'rJvuSQhQR37czfxRou4vNWaM97uEhT4ShE',
        SigningPubKey:
          '02B78EEA571B2633180834CC6E7B4ED84FBF6811D12ECB59410E0C92D13B7726F5',
        TxnSignature:
          '304502210098009CEFA61EE9843BB7FC29B78CFFAACF28352A4A7CF3AAE79EF12D79BA50910220684F116266E5E4519A7A33F7421631EB8494082BE51A8B03FECCB3E59F77154A',
      },
    },
  ],
  SigningPubKey: '',
  TransactionType: 'TrustSet',
})

describe('Signer', function () {
  it('sign', function () {
    // Test case data generated using this tutorial - https://xrpl.org/send-xrp.html#send-xrp
    const tx3: Transaction = {
      TransactionType: 'Payment',
      Account: 'rHLEki8gPUMnF72JnuALvnAMRhRemzhRke',
      Amount: '22000000',
      Destination: 'rPT1Sjq2YGrBMTttX4GZHjKu9dyfzbpAYe',
      Flags: 2147483648,
      LastLedgerSequence: 20582339,
      Fee: '12',
      Sequence: 20582260,
    }
    const signedTxBlob =
      '120000228000000024013A0F74201B013A0FC36140000000014FB18068400000000000000C732102A8A44DB3D4C73EEEE11DFE54D2029103B776AA8A8D293A91D645977C9DF5F544744730450221009ECB5324717E14DD6970126271F05BC2626D2A8FA9F3797555D417F8257C1E6002206BDD74A0F30425F2BA9DB69C90F21B3E27735C190FB4F3A640F066ACBBF06AD98114B3263BD0A9BF9DFDBBBBD07F536355FF477BF0E98314F667B0CA50CC7709A220B0561B85E53A48461FA8'

    const signedTx: string = sign(wallet, tx3)

    assert.equal(signedTx, signedTxBlob)
  })

  it('sign in multisign format', function () {
    const multisignWallet = Wallet.fromSeed(unsignedSecret1)

    assert.deepEqual(
      decode(sign(multisignWallet, unsignedTx1, true)),
      multisignTx1 as unknown as JsonObject,
    )
  })

  it('multisign runs successfully with Transaction objects', function () {
    const transactions = [multisignTxToCombine1, multisignTxToCombine2]

    assert.deepEqual(multisign(transactions), expectedMultisign)
  })

  it('multisign runs successfully with tx_blobs', function () {
    const transactions = [multisignTxToCombine1, multisignTxToCombine2]

    const encodedTransactions = transactions.map(encode)

    assert.deepEqual(multisign(encodedTransactions), expectedMultisign)
  })

  it('multisign throws a validation error when there are no transactions', function () {
    const transactions = []
    assert.throws(() => multisign(transactions), ValidationError)
  })

  it('multisign throws when trying to combine two different transactions', function () {
    const differentMultisignedTx: Transaction = {
      TransactionType: 'Payment',
      Sequence: 1,
      Amount: '20000000',
      Fee: '12',
      SigningPubKey: '',
      Account: 'rhvh5SrgBL5V8oeV9EpDuVszeJSSCEkbPc',
      Destination: 'rQ3PTWGLCbPz8ZCicV5tCX3xuymojTng5r',
      Signers: [
        {
          Signer: {
            SigningPubKey:
              '02A8A44DB3D4C73EEEE11DFE54D2029103B776AA8A8D293A91D645977C9DF5F544',
            TxnSignature:
              '3044022077BCE143B9A0B51A7716BB93CBC0C99FB41BA339D91A87CB9E47DA80A7EF660802205C81AA49D408771F65A131200CCBFC536ACFE212C1414E05E43B56BE1F9380F2',
            Account: 'rHLEki8gPUMnF72JnuALvnAMRhRemzhRke',
          },
        },
      ],
    }

    const transactions = [multisignTxToCombine1, differentMultisignedTx]

    assert.throws(() => multisign(transactions))
  })

  it('multisign throws when trying to combine transaction with normal signature', function () {
    const signedTxBlob =
      '120000228000000024013A0F74201B013A0FC36140000000014FB18068400000000000000C732102A8A44DB3D4C73EEEE11DFE54D2029103B776AA8A8D293A91D645977C9DF5F544744730450221009ECB5324717E14DD6970126271F05BC2626D2A8FA9F3797555D417F8257C1E6002206BDD74A0F30425F2BA9DB69C90F21B3E27735C190FB4F3A640F066ACBBF06AD98114B3263BD0A9BF9DFDBBBBD07F536355FF477BF0E98314F667B0CA50CC7709A220B0561B85E53A48461FA8'

    const transactions = [signedTxBlob]

    assert.throws(() => multisign(transactions), /forMultisign/u)
  })

  it('authorizeChannel succeeds with secp256k1 seed', function () {
    const secpWallet = Wallet.fromSeed('snGHNrPbHrdUcszeuDEigMdC1Lyyd')
    const channelId =
      '5DB01B7FFED6B67E6B0414DED11E051D2EE2B7619CE0EAA6286D67A3A4D5BDB3'
    const amount = '1000000'

    assert.equal(
      authorizeChannel(secpWallet, channelId, amount),
      '304402204E7052F33DDAFAAA55C9F5B132A5E50EE95B2CF68C0902F61DFE77299BC893740220353640B951DCD24371C16868B3F91B78D38B6F3FD1E826413CDF891FA8250AAC',
    )
  })

  it('authorizeChannel succeeds with ed25519 seed', function () {
    const edWallet = Wallet.fromSeed('sEdSuqBPSQaood2DmNYVkwWTn1oQTj2')
    const channelId =
      '5DB01B7FFED6B67E6B0414DED11E051D2EE2B7619CE0EAA6286D67A3A4D5BDB3'
    const amount = '1000000'
    assert.equal(
      authorizeChannel(edWallet, channelId, amount),
      '7E1C217A3E4B3C107B7A356E665088B4FBA6464C48C58267BEF64975E3375EA338AE22E6714E3F5E734AE33E6B97AAD59058E1E196C1F92346FC1498D0674404',
    )
  })

  it('verifySignature succeeds for valid signed transaction blob', function () {
    const signedTx = sign(verifyWallet, tx)

    assert.isTrue(verifySignature(signedTx))
  })

  it('verify succeeds for valid signed transaction object', function () {
    const signedTx = sign(verifyWallet, tx)

    assert.isTrue(verifySignature(decode(signedTx) as unknown as Transaction))
  })

  it('verify throws for invalid signing key', function () {
    const signedTx = sign(verifyWallet, tx)

    const decodedTx = decode(signedTx) as unknown as Transaction

    // Use a different key for validation
    decodedTx.SigningPubKey =
      '0330E7FC9D56BB25D6893BA3F317AE5BCF33B3291BD63DB32654A313222F7FD020'

    assert.isFalse(verifySignature(decodedTx))
  })

  it('sign', async function () {
    const result = sign(
      wallet2,
      JSON.parse(REQUEST_FIXTURES.normal.txJSON) as unknown as Transaction,
    )
    assert.deepEqual(result, RESPONSE_FIXTURES.normal.signedTransaction)
  })

  it('sign with lowercase hex data in memo (hex should be case insensitive)', async function () {
    const secret = 'shd2nxpFD6iBRKWsRss2P4tKMWyy9'
    const lowercaseMemoTx: Transaction = {
      TransactionType: 'Payment',
      Flags: 2147483648,
      Account: 'rwiZ3q3D3QuG4Ga2HyGdq3kPKJRGctVG8a',
      Amount: '10000000',
      LastLedgerSequence: 14000999,
      Destination: 'rUeEBYXHo8vF86Rqir3zWGRQ84W9efdAQd',
      Fee: '12',
      Sequence: 12,
      SourceTag: 8888,
      DestinationTag: 9999,
      Memos: [
        {
          Memo: {
            MemoType:
              '687474703a2f2f6578616d706c652e636f6d2f6d656d6f2f67656e65726963',
            MemoData: '72656e74',
          },
        },
      ],
    }

    const result = sign(Wallet.fromSeed(secret), lowercaseMemoTx)
    assert.equal(
      result,
      '120000228000000023000022B8240000000C2E0000270F201B00D5A36761400000000098968068400000000000000C73210305E09ED602D40AB1AF65646A4007C2DAC17CB6CDACDE301E74FB2D728EA057CF744730450221009C00E8439E017CA622A5A1EE7643E26B4DE9C808DE2ABE45D33479D49A4CEC66022062175BE8733442FA2A4D9A35F85A57D58252AE7B19A66401FE238B36FA28E5A081146C1856D0E36019EA75C56D7E8CBA6E35F9B3F71583147FB49CD110A1C46838788CD12764E3B0F837E0DDF9EA7C1F687474703A2F2F6578616D706C652E636F6D2F6D656D6F2F67656E657269637D0472656E74E1F1',
    )
  })

  it('EscrowExecution', async function () {
    const secret = 'snoPBrXtMeMyMHUVTgbuqAfg1SUTb'
    const result = sign(
      Wallet.fromSeed(secret),
      JSON.parse(REQUEST_FIXTURES.escrow.txJSON) as unknown as Transaction,
    )
    assert.deepEqual(result, RESPONSE_FIXTURES.escrow.signedTransaction)
  })

  it('signAs', async function () {
    const txJSON = REQUEST_FIXTURES.signAs
    const secret = 'snoPBrXtMeMyMHUVTgbuqAfg1SUTb'
    const signature = sign(
      Wallet.fromSeed(secret),
      txJSON as unknown as Transaction,
      true,
    )
    assert.deepEqual(signature, RESPONSE_FIXTURES.signAs.signedTransaction)
  })

  it('withKeypair', async function () {
    const result = sign(
      wallet3,
      JSON.parse(REQUEST_FIXTURES.normal.txJSON) as unknown as Transaction,
    )
    assert.deepEqual(result, RESPONSE_FIXTURES.normal.signedTransaction)
  })

  it('withKeypair already signed', async function () {
    const result = sign(
      wallet3,
      JSON.parse(REQUEST_FIXTURES.normal.txJSON) as unknown as Transaction,
    )
    assert.throws(() => {
      const tx = decode(result) as unknown as Transaction
      sign(wallet, tx)
    }, /txJSON must not contain "TxnSignature" or "Signers" properties/)
  })

  it('withKeypair EscrowExecution', async function () {
    const wallet = new Wallet(
      '0330E7FC9D56BB25D6893BA3F317AE5BCF33B3291BD63DB32654A313222F7FD020',
      '001ACAAEDECE405B2A958212629E16F2EB46B153EEE94CDD350FDEFF52795525B7',
    )
    const result = sign(
      wallet,
      JSON.parse(REQUEST_FIXTURES.escrow.txJSON) as unknown as Transaction,
    )
    assert.deepEqual(result, RESPONSE_FIXTURES.escrow.signedTransaction)
  })

  it('withKeypair signAs', async function () {
    const tx = REQUEST_FIXTURES.signAs as unknown as Transaction
    const wallet = new Wallet(
      '0330E7FC9D56BB25D6893BA3F317AE5BCF33B3291BD63DB32654A313222F7FD020',
      '001ACAAEDECE405B2A958212629E16F2EB46B153EEE94CDD350FDEFF52795525B7',
    )
    const signature = sign(wallet, tx, true)
    assert.deepEqual(signature, RESPONSE_FIXTURES.signAs.signedTransaction)
  })

  it('already signed', async function () {
    const result = sign(wallet2, JSON.parse(REQUEST_FIXTURES.normal.txJSON))
    assert.throws(() => {
      sign(wallet, decode(result) as unknown as Transaction)
    }, /txJSON must not contain "TxnSignature" or "Signers" properties/)
  })

  it('succeeds - no flags', async function () {
    const txJSON =
      '{"TransactionType":"Payment","Account":"r45Rev1EXGxy2hAUmJPCne97KUE7qyrD3j","Destination":"rQ3PTWGLCbPz8ZCicV5tCX3xuymojTng5r","Amount":"20000000","Sequence":1,"Fee":"12"}'
    const secret = 'shotKgaEotpcYsshSE39vmSnBDRim'
    const wallet = Wallet.fromSeed(secret)
    const result = sign(wallet, JSON.parse(txJSON))
    const expectedResult =
      '1200002400000001614000000001312D0068400000000000000C7321022B05847086686F9D0499B13136B94AD4323EE1B67D4C429ECC987AB35ACFA34574473045022100C104B7B97C31FACA4597E7D6FCF13BD85BD11375963A62A0AC45B0061236E39802207784F157F6A98DFC85B051CDDF61CC3084C4F5750B82674801C8E9950280D1998114EE3046A5DDF8422C40DDB93F1D522BB4FE6419158314FDB08D07AAA0EB711793A3027304D688E10C3648'
    const decoded = decode(result)
    assert(
      decoded.Flags == null,
      `Flags = ${decoded.Flags}, should be undefined`,
    )
    assert.equal(result, expectedResult)
  })

  it('sign succeeds with source.amount/destination.minAmount', async function () {
    // See also: 'preparePayment with source.amount/destination.minAmount'

    const txJSON =
      '{"TransactionType":"Payment","Account":"r9cZA1mLK5R5Am25ArfXFmqgNwjZgnfk59","Destination":"rEX4LtGJubaUcMWCJULcy4NVxGT9ZEMVRq","Amount":{"currency":"USD","issuer":"rMaa8VLBTjwTJWA2kSme4Sqgphhr6Lr6FH","value":"999999999999999900000000000000000000000000000000000000000000000000000000000000000000000000000000"},"Flags":2147614720,"SendMax":{"currency":"GBP","issuer":"rpat5TmYjDsnFSStmgTumFgXCM9eqsWPro","value":"0.1"},"DeliverMin":{"currency":"USD","issuer":"rMaa8VLBTjwTJWA2kSme4Sqgphhr6Lr6FH","value":"0.1248548562296331"},"Sequence":23,"LastLedgerSequence":8820051,"Fee":"12"}'
    const secret = 'shotKgaEotpcYsshSE39vmSnBDRim'
    const wallet = Wallet.fromSeed(secret)
    const result = sign(wallet, JSON.parse(txJSON))
    const expectedResult =
      '12000022800200002400000017201B0086955361EC6386F26FC0FFFF0000000000000000000000005553440000000000DC596C88BCDE4E818D416FCDEEBF2C8656BADC9A68400000000000000C69D4438D7EA4C6800000000000000000000000000047425000000000000C155FFE99C8C91F67083CEFFDB69EBFE76348CA6AD4446F8C5D8A5E0B0000000000000000000000005553440000000000DC596C88BCDE4E818D416FCDEEBF2C8656BADC9A7321022B05847086686F9D0499B13136B94AD4323EE1B67D4C429ECC987AB35ACFA34574473045022100D9634523D8E232D4A7807A71856023D82AC928FA29848571B820867898413B5F022041AC00EC1F81A26A6504EBF844A38CC3204694EF2CC1A97A87632721631F93DA81145E7B112523F68D2F5E879DB4EAC51C6698A6930483149F500E50C2F016CA01945E5A1E5846B61EF2D376'
    const decoded = decode(result)
    assert(
      decoded.Flags === 2147614720,
      `Flags = ${decoded.Flags}, should be 2147614720`,
    )
    assert.deepEqual(result, expectedResult)
  })

  it('throws when encoded tx does not match decoded tx - AccountSet', async function () {
    const request = {
      txJSON: `{"Flags":2147483648,"TransactionType":"AccountSet","Account":"r9cZA1mLK5R5Am25ArfXFmqgNwjZgnfk59","Domain":"6578616D706C652E636F6D","LastLedgerSequence":8820051,"Fee":"1.2","Sequence":23,"SigningPubKey":"02F89EAEC7667B30F33D0687BBA86C3FE2A08CCA40A9186C5BDE2DAA6FA97A37D8"}`,
      instructions: {
        fee: '0.0000012',
        sequence: 23,
        maxLedgerVersion: 8820051,
      },
    }

    assert.throws(() => {
      sign(wallet2, JSON.parse(request.txJSON))
    }, /1\.2 is an illegal amount/)
  })

  it('throws when encoded tx does not match decoded tx - higher fee', async function () {
    const request = {
      txJSON: `{"Flags":2147483648,"TransactionType":"AccountSet","Account":"r9cZA1mLK5R5Am25ArfXFmqgNwjZgnfk59","Domain":"6578616D706C652E636F6D","LastLedgerSequence":8820051,"Fee":"1123456.7","Sequence":23,"SigningPubKey":"02F89EAEC7667B30F33D0687BBA86C3FE2A08CCA40A9186C5BDE2DAA6FA97A37D8"}`,
      instructions: {
        fee: '1.1234567',
        sequence: 23,
        maxLedgerVersion: 8820051,
      },
    }

    assert.throws(() => {
      sign(wallet2, JSON.parse(request.txJSON))
    }, /1123456\.7 is an illegal amount/)
  })

  it('sign with ticket', async function () {
    const wallet = Wallet.fromSeed('sn7n5R1cR5Y3fRFkuWXA94Ts1frVJ')
    const result = sign(wallet, JSON.parse(REQUEST_FIXTURES.ticket.txJSON))
    assert.deepEqual(result, RESPONSE_FIXTURES.ticket.signedTransaction)
  })

  it('sign with paths', async function () {
    const wallet = Wallet.fromSeed('shsWGZcmZz6YsWWmcnpfr6fLTdtFV')
    const payment: Transaction = {
      TransactionType: 'Payment',
      Account: 'r9cZA1mLK5R5Am25ArfXFmqgNwjZgnfk59',
      Destination: 'rKT4JX4cCof6LcDYRz8o3rGRu7qxzZ2Zwj',
      Amount: {
        currency: 'USD',
        issuer: 'rVnYNK9yuxBz4uP8zC8LEFokM2nqH3poc',
        value:
          '999999999999999900000000000000000000000000000000000000000000000000000000000000000000000000000000',
      },
      Flags: 2147614720,
      SendMax: '100',
      DeliverMin: {
        currency: 'USD',
        issuer: 'rVnYNK9yuxBz4uP8zC8LEFokM2nqH3poc',
        value: '0.00004579644712312366',
      },
      Paths: [
        [{ currency: 'USD', issuer: 'rVnYNK9yuxBz4uP8zC8LEFokM2nqH3poc' }],
      ],
      LastLedgerSequence: 15696358,
      Sequence: 1,
      Fee: '12',
    }
    const result = sign(wallet, payment)
    assert.deepEqual(
      result,
      '12000022800200002400000001201B00EF81E661EC6386F26FC0FFFF0000000000000000000000005553440000000000054F6F784A58F9EFB0A9EB90B83464F9D166461968400000000000000C6940000000000000646AD3504529A0465E2E0000000000000000000000005553440000000000054F6F784A58F9EFB0A9EB90B83464F9D1664619732102F89EAEC7667B30F33D0687BBA86C3FE2A08CCA40A9186C5BDE2DAA6FA97A37D87446304402200A693FB5CA6B21250EBDFD8CFF526EE0DF7C9E4E31EB0660692E75E6A93BF5F802203CC39463DDA21386898CA31E18AD1A6828647D65741DD637BAD71BC83E29DB9481145E7B112523F68D2F5E879DB4EAC51C6698A693048314CA6EDC7A28252DAEA6F2045B24F4D7C333E146170112300000000000000000000000005553440000000000054F6F784A58F9EFB0A9EB90B83464F9D166461900',
    )
  })

  it('succeeds - prepared payment', async function () {
    const payment: Transaction = {
      TransactionType: 'Payment',
      Account: 'r9cZA1mLK5R5Am25ArfXFmqgNwjZgnfk59',
      Destination: 'rQ3PTWGLCbPz8ZCicV5tCX3xuymojTng5r',
      Amount: '1',
      Flags: 2147483648,
      Sequence: 23,
      LastLedgerSequence: 8819954,
      Fee: '12',
    }
    const result = sign(wallet2, payment)
    const expectedResult =
      '12000022800000002400000017201B008694F261400000000000000168400000000000000C732102F89EAEC7667B30F33D0687BBA86C3FE2A08CCA40A9186C5BDE2DAA6FA97A37D874473045022100A9C91D4CFAE45686146EE0B56D4C53A2E7C2D672FB834D43E0BE2D2E9106519A022075DDA2F92DE552B0C45D83D4E6D35889B3FBF51BFBBD9B25EBF70DE3C96D0D6681145E7B112523F68D2F5E879DB4EAC51C6698A693048314FDB08D07AAA0EB711793A3027304D688E10C3648'
    assert.deepEqual(result, expectedResult)
  })

  it('throws when encoded tx does not match decoded tx - prepared payment', async function () {
    const payment: Transaction = {
      TransactionType: 'Payment',
      Account: 'r9cZA1mLK5R5Am25ArfXFmqgNwjZgnfk59',
      Destination: 'rQ3PTWGLCbPz8ZCicV5tCX3xuymojTng5r',
      Amount: '1.1234567',
      Flags: 2147483648,
      Sequence: 23,
      LastLedgerSequence: 8819954,
      Fee: '12',
    }
    assert.throws(() => {
      sign(wallet2, payment)
    }, /^1.1234567 is an illegal amount/)
  })
})
