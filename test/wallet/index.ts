import { assert } from 'chai'
import { decode } from 'ripple-binary-codec/dist'

import { Transaction } from 'xrpl-local'
import ECDSA from 'xrpl-local/ecdsa'
import Wallet from 'xrpl-local/wallet'

import requests from '../fixtures/requests'
import responses from '../fixtures/responses'

const { sign: REQUEST_FIXTURES } = requests
const { sign: RESPONSE_FIXTURES } = responses

/**
 * Wallet testing.
 *
 * Provides tests for Wallet class.
 */
describe('Wallet', function () {
  describe('generate', function () {
    const classicAddressPrefix = 'r'
    const ed25519KeyPrefix = 'ED'
    const secp256k1PrivateKeyPrefix = '00'

    it('generates a new wallet using default algorithm', function () {
      const wallet = Wallet.generate()

      assert.isString(wallet.publicKey)
      assert.isString(wallet.privateKey)
      assert.isString(wallet.classicAddress)
      assert.isString(wallet.address)
      assert.equal(wallet.classicAddress, wallet.address)
      assert.isString(wallet.seed)
      assert.isTrue(wallet.publicKey.startsWith(ed25519KeyPrefix))
      assert.isTrue(wallet.privateKey.startsWith(ed25519KeyPrefix))
      assert.isTrue(wallet.classicAddress.startsWith(classicAddressPrefix))
    })

    it('generates a new wallet using algorithm ecdsa-secp256k1', function () {
      const algorithm = ECDSA.secp256k1
      const wallet = Wallet.generate(algorithm)

      assert.isString(wallet.publicKey)
      assert.isString(wallet.privateKey)
      assert.isString(wallet.classicAddress)
      assert.isString(wallet.address)
      assert.equal(wallet.classicAddress, wallet.address)
      assert.isString(wallet.seed)
      assert.isTrue(wallet.privateKey.startsWith(secp256k1PrivateKeyPrefix))
      assert.isTrue(wallet.classicAddress.startsWith(classicAddressPrefix))
    })

    it('generates a new wallet using algorithm ed25519', function () {
      const algorithm = ECDSA.ed25519
      const wallet = Wallet.generate(algorithm)

      assert.isString(wallet.publicKey)
      assert.isString(wallet.privateKey)
      assert.isString(wallet.classicAddress)
      assert.isString(wallet.address)
      assert.equal(wallet.classicAddress, wallet.address)
      assert.isString(wallet.seed)
      assert.isTrue(wallet.publicKey.startsWith(ed25519KeyPrefix))
      assert.isTrue(wallet.privateKey.startsWith(ed25519KeyPrefix))
      assert.isTrue(wallet.classicAddress.startsWith(classicAddressPrefix))
    })
  })

  describe('fromSeed', function () {
    const seed = 'ssL9dv2W5RK8L3tuzQxYY6EaZhSxW'
    const publicKey =
      '030E58CDD076E798C84755590AAF6237CA8FAE821070A59F648B517A30DC6F589D'
    const privateKey =
      '00141BA006D3363D2FB2785E8DF4E44D3A49908780CB4FB51F6D217C08C021429F'

    it('derives a wallet using default algorithm', function () {
      const wallet = Wallet.fromSeed(seed)

      assert.equal(wallet.publicKey, publicKey)
      assert.equal(wallet.privateKey, privateKey)
    })

    it('derives a wallet using algorithm ecdsa-secp256k1', function () {
      const algorithm = ECDSA.secp256k1
      const wallet = Wallet.fromSeed(seed, algorithm)

      assert.equal(wallet.publicKey, publicKey)
      assert.equal(wallet.privateKey, privateKey)
    })

    it('derives a wallet using algorithm ed25519', function () {
      const algorithm = ECDSA.ed25519
      const wallet = Wallet.fromSeed(seed, algorithm)

      assert.equal(wallet.publicKey, publicKey)
      assert.equal(wallet.privateKey, privateKey)
    })
  })

  describe('fromSecret', function () {
    const seed = 'ssL9dv2W5RK8L3tuzQxYY6EaZhSxW'
    const publicKey =
      '030E58CDD076E798C84755590AAF6237CA8FAE821070A59F648B517A30DC6F589D'
    const privateKey =
      '00141BA006D3363D2FB2785E8DF4E44D3A49908780CB4FB51F6D217C08C021429F'

    it('derives a wallet using default algorithm', function () {
      const wallet = Wallet.fromSecret(seed)

      assert.equal(wallet.publicKey, publicKey)
      assert.equal(wallet.privateKey, privateKey)
    })

    it('derives a wallet using algorithm ecdsa-secp256k1', function () {
      const algorithm = ECDSA.secp256k1
      const wallet = Wallet.fromSecret(seed, algorithm)

      assert.equal(wallet.publicKey, publicKey)
      assert.equal(wallet.privateKey, privateKey)
    })

    it('derives a wallet using algorithm ed25519', function () {
      const algorithm = ECDSA.ed25519
      const wallet = Wallet.fromSecret(seed, algorithm)

      assert.equal(wallet.publicKey, publicKey)
      assert.equal(wallet.privateKey, privateKey)
    })
  })

  describe('fromMnemonic', function () {
    const mnemonic =
      'try milk link drift aware pass obtain again music stick pluck fold'
    const publicKey =
      '0257B550BA2FDCCF0ADDA3DEB2A5411700F3ADFDCC7C68E1DCD1E2B63E6B0C63E6'
    const privateKey =
      '008F942B6E229C0E9CEE47E7A94253DABB6A9855F4BA2D8A741FA31851A1D423C3'

    it('derives a wallet using default derivation path', function () {
      const wallet = Wallet.fromMnemonic(mnemonic)

      assert.equal(wallet.publicKey, publicKey)
      assert.equal(wallet.privateKey, privateKey)
    })

    it('derives a wallet using an input derivation path', function () {
      const derivationPath = "m/44'/144'/0'/0/0"
      const wallet = Wallet.fromMnemonic(mnemonic, derivationPath)

      assert.equal(wallet.publicKey, publicKey)
      assert.equal(wallet.privateKey, privateKey)
    })
  })

  describe('fromEntropy', function () {
    let entropy
    const publicKey =
      '0390A196799EE412284A5D80BF78C3E84CBB80E1437A0AECD9ADF94D7FEAAFA284'
    const privateKey =
      '002512BBDFDBB77510883B7DCCBEF270B86DEAC8B64AC762873D75A1BEE6298665'
    const publicKeyED25519 =
      'ED1A7C082846CFF58FF9A892BA4BA2593151CCF1DBA59F37714CC9ED39824AF85F'
    const privateKeyED25519 =
      'ED0B6CBAC838DFE7F47EA1BD0DF00EC282FDF45510C92161072CCFB84035390C4D'

    beforeEach(function () {
      const entropySize = 16
      entropy = new Array(entropySize).fill(0)
    })

    it('derives a wallet using entropy', function () {
      const wallet = Wallet.fromEntropy(entropy)

      assert.equal(wallet.publicKey, publicKeyED25519)
      assert.equal(wallet.privateKey, privateKeyED25519)
    })

    it('derives a wallet using algorithm ecdsa-secp256k1', function () {
      const algorithm = ECDSA.secp256k1
      const wallet = Wallet.fromEntropy(entropy, algorithm)

      assert.equal(wallet.publicKey, publicKey)
      assert.equal(wallet.privateKey, privateKey)
    })

    it('derives a wallet using algorithm ed25519', function () {
      const algorithm = ECDSA.ed25519
      const wallet = Wallet.fromEntropy(entropy, algorithm)

      assert.equal(wallet.publicKey, publicKeyED25519)
      assert.equal(wallet.privateKey, privateKeyED25519)
    })
  })

  describe('signTransaction', function () {
    let wallet: Wallet

    beforeEach(function () {
      wallet = Wallet.fromSeed('ss1x3KLrSvfg7irFc1D929WXZ7z9H')
    })

    it('signTransaction successfully', async function () {
      const result = wallet.sign(REQUEST_FIXTURES.normal as Transaction)
      assert.deepEqual(result, {
        tx_blob: RESPONSE_FIXTURES.normal.signedTransaction,
        hash: '93F6C6CE73C092AA005103223F3A1F557F4C097A2943D96760F6490F04379917',
      })
    })

    it('signTransaction with lowercase hex data in memo (hex should be case insensitive)', async function () {
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

      const result = Wallet.fromSeed(secret).sign(lowercaseMemoTx)
      assert.deepEqual(result, {
        tx_blob:
          '120000228000000023000022B8240000000C2E0000270F201B00D5A36761400000000098968068400000000000000C73210305E09ED602D40AB1AF65646A4007C2DAC17CB6CDACDE301E74FB2D728EA057CF744730450221009C00E8439E017CA622A5A1EE7643E26B4DE9C808DE2ABE45D33479D49A4CEC66022062175BE8733442FA2A4D9A35F85A57D58252AE7B19A66401FE238B36FA28E5A081146C1856D0E36019EA75C56D7E8CBA6E35F9B3F71583147FB49CD110A1C46838788CD12764E3B0F837E0DDF9EA7C1F687474703A2F2F6578616D706C652E636F6D2F6D656D6F2F67656E657269637D0472656E74E1F1',
        hash: '41B9CB78D8E18A796CDD4B0BC6FB0EA19F64C4F25FDE23049197852CAB71D10D',
      })
    })

    it('signTransaction with EscrowFinish', async function () {
      const result = wallet.sign(REQUEST_FIXTURES.escrow as Transaction)
      assert.deepEqual(result, {
        tx_blob: RESPONSE_FIXTURES.escrow.signedTransaction,
        hash: '645B7676DF057E4F5E83F970A18B3751B6813807F1030A8D2F482D02DC885106',
      })
    })

    it('signTransaction with multisignAddress', async function () {
      const signature = wallet.sign(
        REQUEST_FIXTURES.signAs as Transaction,
        true,
      )
      assert.deepEqual(signature, {
        tx_blob: RESPONSE_FIXTURES.signAs.signedTransaction,
        hash: 'D8CF5FC93CFE5E131A34599AFB7CE186A5B8D1B9F069E35F4634AD3B27837E35',
      })
    })

    it('signTransaction with X Address and no given tag for multisignAddress', async function () {
      const signature = wallet.sign(
        REQUEST_FIXTURES.signAs as Transaction,
        wallet.getXAddress(),
      )
      assert.deepEqual(signature, {
        tx_blob: RESPONSE_FIXTURES.signAs.signedTransaction,
        hash: 'D8CF5FC93CFE5E131A34599AFB7CE186A5B8D1B9F069E35F4634AD3B27837E35',
      })
    })

    it('signTransaction with X Address and tag for multisignAddress', async function () {
      const signature = wallet.sign(
        REQUEST_FIXTURES.signAs as Transaction,
        wallet.getXAddress(0),
      )
      // Adding a tag changes the classicAddress, which changes the signature from RESPONSE_FIXTURES.signAs
      const expectedSignature = {
        tx_blob:
          '120000240000000261400000003B9ACA00684000000000000032730081142E244E6F20104E57C0C60BD823CB312BF10928C78314B5F762798A53D543A014CAF8B297CFF8F2F937E8F3E0102300000000732102A8A44DB3D4C73EEEE11DFE54D2029103B776AA8A8D293A91D645977C9DF5F54474473045022100B3F8205578C6A68D3BBD27650F5D2E983718D502C250C5147F07B7EDD8E8583E02207B892818BD58E328C2797F15694A505937861586D527849065B582523E390B128114B3263BD0A9BF9DFDBBBBD07F536355FF477BF0E9E1F1',
        hash: 'D4E6BC7FEA5B9624A09750F8931BE269554BE8C735A83EBD012188B87D4757C8',
      }

      assert.deepEqual(signature, expectedSignature)
    })

    it('signTransaction throws when given a transaction that is already signed', async function () {
      const result = wallet.sign(REQUEST_FIXTURES.normal as Transaction)
      assert.throws(() => {
        const tx = decode(result.tx_blob) as unknown as Transaction
        wallet.sign(tx)
      }, /txJSON must not contain "TxnSignature" or "Signers" properties/u)
    })

    it('signTransaction with an EscrowExecution transaction', async function () {
      const result = wallet.sign(REQUEST_FIXTURES.escrow as Transaction)
      assert.deepEqual(result, {
        tx_blob: RESPONSE_FIXTURES.escrow.signedTransaction,
        hash: '645B7676DF057E4F5E83F970A18B3751B6813807F1030A8D2F482D02DC885106',
      })
    })

    it('signTransaction succeeds when given a transaction with no flags', async function () {
      const tx: Transaction = {
        TransactionType: 'Payment',
        Account: 'r45Rev1EXGxy2hAUmJPCne97KUE7qyrD3j',
        Destination: 'rQ3PTWGLCbPz8ZCicV5tCX3xuymojTng5r',
        Amount: '20000000',
        Sequence: 1,
        Fee: '12',
      }
      const result = wallet.sign(tx)
      const expectedResult = {
        tx_blob:
          '1200002400000001614000000001312D0068400000000000000C732102A8A44DB3D4C73EEEE11DFE54D2029103B776AA8A8D293A91D645977C9DF5F5447446304402201C0A74EE8ECF5ED83734D7171FB65C01D90D67040DEDCC66414BD546CE302B5802205356843841BFFF60D15F5F5F9FB0AB9D66591778140AB2D137FF576D9DEC44BC8114EE3046A5DDF8422C40DDB93F1D522BB4FE6419158314FDB08D07AAA0EB711793A3027304D688E10C3648',
        hash: 'E22186AE9FE477821BF361358174C2B0AC2D3289AA6F7E8C1102B3D270C41204',
      }

      const decoded = decode(result.tx_blob)
      assert(
        decoded.Flags == null,
        `Flags = ${JSON.stringify(decoded.Flags)}, should be undefined`,
      )
      assert.deepEqual(result, expectedResult)
    })

    it('signTransaction succeeds with source.amount/destination.minAmount', async function () {
      // See also: 'preparePayment with source.amount/destination.minAmount'

      const tx: Transaction = {
        TransactionType: 'Payment',
        Account: 'r9cZA1mLK5R5Am25ArfXFmqgNwjZgnfk59',
        Destination: 'rEX4LtGJubaUcMWCJULcy4NVxGT9ZEMVRq',
        Amount: {
          currency: 'USD',
          issuer: 'rMaa8VLBTjwTJWA2kSme4Sqgphhr6Lr6FH',
          value:
            '999999999999999900000000000000000000000000000000000000000000000000000000000000000000000000000000',
        },
        Flags: 2147614720,
        SendMax: {
          currency: 'GBP',
          issuer: 'rpat5TmYjDsnFSStmgTumFgXCM9eqsWPro',
          value: '0.1',
        },
        DeliverMin: {
          currency: 'USD',
          issuer: 'rMaa8VLBTjwTJWA2kSme4Sqgphhr6Lr6FH',
          value: '0.1248548562296331',
        },
        Sequence: 23,
        LastLedgerSequence: 8820051,
        Fee: '12',
      }

      const result = wallet.sign(tx)
      const expectedResult = {
        tx_blob:
          '12000022800200002400000017201B0086955361EC6386F26FC0FFFF0000000000000000000000005553440000000000DC596C88BCDE4E818D416FCDEEBF2C8656BADC9A68400000000000000C69D4438D7EA4C6800000000000000000000000000047425000000000000C155FFE99C8C91F67083CEFFDB69EBFE76348CA6AD4446F8C5D8A5E0B0000000000000000000000005553440000000000DC596C88BCDE4E818D416FCDEEBF2C8656BADC9A732102A8A44DB3D4C73EEEE11DFE54D2029103B776AA8A8D293A91D645977C9DF5F544744630440220297E0C7670C7DA491E0D649E62C123D988BA93FD7EA1B9141F1D376CDDF902F502205AF1936B22B18BBA7793A88ABEEABADB4CE0E4C3BE583066480F2F476B5ED08E81145E7B112523F68D2F5E879DB4EAC51C6698A6930483149F500E50C2F016CA01945E5A1E5846B61EF2D376',
        hash: 'FB2813E9E673EF56609070A4BA9640FAD0508DA567320AE9D92FB5A356A03D84',
      }
      const decoded = decode(result.tx_blob)
      assert(
        decoded.Flags === 2147614720,
        `Flags = ${JSON.stringify(decoded.Flags)}, should be 2147614720`,
      )
      assert.deepEqual(result, expectedResult)
    })

    it('signTransaction throws when encoded tx does not match decoded tx because of illegal small fee', async function () {
      const tx: Transaction = {
        Flags: 2147483648,
        TransactionType: 'AccountSet',
        Account: 'r9cZA1mLK5R5Am25ArfXFmqgNwjZgnfk59',
        Domain: '6578616D706C652E636F6D',
        LastLedgerSequence: 8820051,
        Fee: '1.2',
        Sequence: 23,
        SigningPubKey:
          '02F89EAEC7667B30F33D0687BBA86C3FE2A08CCA40A9186C5BDE2DAA6FA97A37D8',
      }

      assert.throws(() => {
        wallet.sign(tx)
      }, /1\.2 is an illegal amount/u)
    })

    it('signTransaction throws when encoded tx does not match decoded tx because of illegal higher fee', async function () {
      const tx: Transaction = {
        Flags: 2147483648,
        TransactionType: 'AccountSet',
        Account: 'r9cZA1mLK5R5Am25ArfXFmqgNwjZgnfk59',
        Domain: '6578616D706C652E636F6D',
        LastLedgerSequence: 8820051,
        Fee: '1123456.7',
        Sequence: 23,
        SigningPubKey:
          '02F89EAEC7667B30F33D0687BBA86C3FE2A08CCA40A9186C5BDE2DAA6FA97A37D8',
      }

      assert.throws(() => {
        wallet.sign(tx)
      }, /1123456\.7 is an illegal amount/u)
    })

    it('signTransaction with a ticket transaction', async function () {
      const result = wallet.sign(REQUEST_FIXTURES.ticket as Transaction)
      assert.deepEqual(result, {
        tx_blob: RESPONSE_FIXTURES.ticket.signedTransaction,
        hash: '0AC60B1E1F063904D9D9D0E9D03F2E9C8D41BC6FC872D5B8BF87E15BBF9669BB',
      })
    })

    it('signTransaction with a Payment transaction with paths', async function () {
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
      const result = wallet.sign(payment)
      assert.deepEqual(result, {
        tx_blob:
          '12000022800200002400000001201B00EF81E661EC6386F26FC0FFFF0000000000000000000000005553440000000000054F6F784A58F9EFB0A9EB90B83464F9D166461968400000000000000C6940000000000000646AD3504529A0465E2E0000000000000000000000005553440000000000054F6F784A58F9EFB0A9EB90B83464F9D1664619732102A8A44DB3D4C73EEEE11DFE54D2029103B776AA8A8D293A91D645977C9DF5F54474463044022049AD75980A5088EBCD768547E06427736BD8C4396B9BD3762CA8C1341BD7A4F9022060C94071C3BDF99FAB4BEB7C0578D6EBEE083157B470699645CCE4738A41D61081145E7B112523F68D2F5E879DB4EAC51C6698A693048314CA6EDC7A28252DAEA6F2045B24F4D7C333E146170112300000000000000000000000005553440000000000054F6F784A58F9EFB0A9EB90B83464F9D166461900',
        hash: '71D0B4AA13277B32E2C2E751566BB0106764881B0CAA049905A0EDAC73257745',
      })
    })

    it('signTransaction with a prepared payment', async function () {
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
      const result = wallet.sign(payment)
      const expectedResult = {
        tx_blob:
          '12000022800000002400000017201B008694F261400000000000000168400000000000000C732102A8A44DB3D4C73EEEE11DFE54D2029103B776AA8A8D293A91D645977C9DF5F54474473045022100E8929B68B137AB2AAB1AD3A4BB253883B0C8C318DC8BB39579375751B8E54AC502206893B2D61244AFE777DAC9FA3D9DDAC7780A9810AF4B322D629784FD626B8CE481145E7B112523F68D2F5E879DB4EAC51C6698A693048314FDB08D07AAA0EB711793A3027304D688E10C3648',
        hash: 'AA1D2BDC59E504AA6C2416E864C615FB18042C1AB4457BEB883F7194D8C452B5',
      }

      assert.deepEqual(result, expectedResult)
    })

    it('signTransaction throws when an illegal amount is provided', async function () {
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
        wallet.sign(payment)
      }, /^1.1234567 is an illegal amount/u)
    })
  })

  describe('verifyTransaction', function () {
    const publicKey =
      '030E58CDD076E798C84755590AAF6237CA8FAE821070A59F648B517A30DC6F589D'
    const privateKey =
      '00141BA006D3363D2FB2785E8DF4E44D3A49908780CB4FB51F6D217C08C021429F'
    const prepared = {
      signedTransaction:
        '1200002400000001614000000001312D0068400000000000000C7321030E58CDD076E798C84755590AAF6237CA8FAE821070A59F648B517A30DC6F589D74473045022100CAF99A63B241F5F62B456C68A593D2835397101533BB5D0C4DC17362AC22046F022016A2CA2CF56E777B10E43B56541A4C2FB553E7E298CDD39F7A8A844DA491E51D81142AF1861DEC1316AEEC995C94FF9E2165B1B784608314FDB08D07AAA0EB711793A3027304D688E10C3648',
      id: '30D9ECA2A7FB568C5A8607E5850D9567572A9E7C6094C26BEFD4DC4C2CF2657A',
    }

    it('returns true when verifying a transaction signed by the same wallet', function () {
      const wallet = new Wallet(publicKey, privateKey)
      const isVerified: boolean = wallet.verifyTransaction(
        prepared.signedTransaction,
      )

      assert.equal(isVerified, true)
    })

    it('returns false when verifying a transaction signed by a different wallet', function () {
      const diffPublicKey =
        '02F89EAEC7667B30F33D0687BBA86C3FE2A08CCA40A9186C5BDE2DAA6FA97A37D8'
      const diffPrivateKey =
        '00ACCD3309DB14D1A4FC9B1DAE608031F4408C85C73EE05E035B7DC8B25840107A'
      const wallet = new Wallet(diffPublicKey, diffPrivateKey)
      const isVerified: boolean = wallet.verifyTransaction(
        prepared.signedTransaction,
      )

      assert.equal(isVerified, false)
    })
  })

  describe('getXAddress', function () {
    const publicKey =
      '030E58CDD076E798C84755590AAF6237CA8FAE821070A59F648B517A30DC6F589D'
    const privateKey =
      '00141BA006D3363D2FB2785E8DF4E44D3A49908780CB4FB51F6D217C08C021429F'
    const wallet = new Wallet(publicKey, privateKey)
    const tag = 1337
    const mainnetXAddress = 'X7gJ5YK8abHf2eTPWPFHAAot8Knck11QGqmQ7a6a3Z8PJvk'
    const testnetXAddress = 'T7bq3e7kxYq9pwDz8UZhqAZoEkcRGTXSNr5immvcj3DYRaV'

    it('returns a Testnet X-address when test is true', function () {
      const result = wallet.getXAddress(tag, true)
      assert.equal(result, testnetXAddress)
    })

    it('returns a Mainnet X-address when test is false', function () {
      const result = wallet.getXAddress(tag, false)
      assert.equal(result, mainnetXAddress)
    })

    it("returns a Mainnet X-address when test isn't provided", function () {
      const result = wallet.getXAddress(tag)
      assert.equal(result, mainnetXAddress)
    })
  })
})
