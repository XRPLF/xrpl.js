import assert from 'assert-diff'
import {Client} from 'xrpl-local'
import binary from 'ripple-binary-codec'
import requests from '../fixtures/requests'
import responses from '../fixtures/responses'
import rippled from '../fixtures/rippled'
import {TestSuite} from '../testUtils'

const {schemaValidator} = Client._PRIVATE
const {sign: REQUEST_FIXTURES} = requests
const {sign: RESPONSE_FIXTURES} = responses

/**
 * Every test suite exports their tests in the default object.
 * - Check out the "TestSuite" type for documentation on the interface.
 * - Check out "test/client/index.ts" for more information about the test runner.
 */
export default <TestSuite>{
  'sign': async (client, address) => {
    const secret = 'shsWGZcmZz6YsWWmcnpfr6fLTdtFV'
    const result = client.sign(REQUEST_FIXTURES.normal.txJSON, secret)
    assert.deepEqual(result, RESPONSE_FIXTURES.normal)
    schemaValidator.schemaValidate('sign', result)
  },

  'sign with lowercase hex data in memo (hex should be case insensitive)': async (client, address) => {
    const secret = 'shd2nxpFD6iBRKWsRss2P4tKMWyy9';
    const lowercaseMemoTxJson = {
      "TransactionType"   : "Payment",
      "Flags"             : 2147483648,
      "Account"           : "rwiZ3q3D3QuG4Ga2HyGdq3kPKJRGctVG8a",
      "Amount"            : "10000000",
      "LastLedgerSequence": 14000999,
      "Destination"       : "rUeEBYXHo8vF86Rqir3zWGRQ84W9efdAQd",
      "Fee"               : "12",
      "Sequence"          : 12,
      "SourceTag"         : 8888,
      "DestinationTag"    : 9999,
      "Memos"             : [
       {
           "Memo": {
               "MemoType" :"687474703a2f2f6578616d706c652e636f6d2f6d656d6f2f67656e65726963",
               "MemoData" :"72656e74"
           }
       }
      ]
    }

    const txParams = JSON.stringify(lowercaseMemoTxJson);
    const result = client.sign(txParams, secret);
    assert.deepEqual(result, {
      signedTransaction: '120000228000000023000022B8240000000C2E0000270F201B00D5A36761400000000098968068400000000000000C73210305E09ED602D40AB1AF65646A4007C2DAC17CB6CDACDE301E74FB2D728EA057CF744730450221009C00E8439E017CA622A5A1EE7643E26B4DE9C808DE2ABE45D33479D49A4CEC66022062175BE8733442FA2A4D9A35F85A57D58252AE7B19A66401FE238B36FA28E5A081146C1856D0E36019EA75C56D7E8CBA6E35F9B3F71583147FB49CD110A1C46838788CD12764E3B0F837E0DDF9EA7C1F687474703A2F2F6578616D706C652E636F6D2F6D656D6F2F67656E657269637D0472656E74E1F1',
      id: '41B9CB78D8E18A796CDD4B0BC6FB0EA19F64C4F25FDE23049197852CAB71D10D'
    })
  },

  'sign with paths': async (
    client,
    address,
    mockRippled
  ) => {
    mockRippled.addResponse({command: 'server_info'}, rippled.server_info.normal)
    mockRippled.addResponse({command: 'fee'}, rippled.fee)
    mockRippled.addResponse({command: 'ledger_current'}, rippled.ledger_current)
    mockRippled.addResponse({command: 'account_info'}, rippled.account_info.normal)
    const secret = 'shsWGZcmZz6YsWWmcnpfr6fLTdtFV'
    const payment = {
      source: {
        address: address,
        amount: {
          currency: 'drops',
          value: '100'
        }
      },
      destination: {
        address: 'rKT4JX4cCof6LcDYRz8o3rGRu7qxzZ2Zwj',
        minAmount: {
          currency: 'USD',
          value: '0.00004579644712312366',
          counterparty: 'rVnYNK9yuxBz4uP8zC8LEFokM2nqH3poc'
        }
      },
      // eslint-disable-next-line no-useless-escape
      paths: '[[{\"currency\":\"USD\",\"issuer\":\"rVnYNK9yuxBz4uP8zC8LEFokM2nqH3poc\"}]]'
    }
    const ret = await client.preparePayment(address, payment, {sequence: 1, maxLedgerVersion: 15696358})
    const result = client.sign(ret.txJSON, secret)
    assert.deepEqual(result, {
      signedTransaction: '12000022800200002400000001201B00EF81E661EC6386F26FC0FFFF0000000000000000000000005553440000000000054F6F784A58F9EFB0A9EB90B83464F9D166461968400000000000000C6940000000000000646AD3504529A0465E2E0000000000000000000000005553440000000000054F6F784A58F9EFB0A9EB90B83464F9D1664619732102F89EAEC7667B30F33D0687BBA86C3FE2A08CCA40A9186C5BDE2DAA6FA97A37D87446304402200A693FB5CA6B21250EBDFD8CFF526EE0DF7C9E4E31EB0660692E75E6A93BF5F802203CC39463DDA21386898CA31E18AD1A6828647D65741DD637BAD71BC83E29DB9481145E7B112523F68D2F5E879DB4EAC51C6698A693048314CA6EDC7A28252DAEA6F2045B24F4D7C333E146170112300000000000000000000000005553440000000000054F6F784A58F9EFB0A9EB90B83464F9D166461900',
      id: '78874FE5F5299FEE3EA85D3CF6C1FB1F1D46BB08F716662A3E3D1F0ADE4EF796'
    })
    schemaValidator.schemaValidate('sign', result)
  },

  'already signed': async (client, address) => {
    const secret = 'shsWGZcmZz6YsWWmcnpfr6fLTdtFV'
    const result = client.sign(REQUEST_FIXTURES.normal.txJSON, secret)
    assert.throws(() => {
      const tx = JSON.stringify(binary.decode(result.signedTransaction))
      client.sign(tx, secret)
    }, /txJSON must not contain "TxnSignature" or "Signers" properties/)
  },

  'EscrowExecution': async (client, address) => {
    const secret = 'snoPBrXtMeMyMHUVTgbuqAfg1SUTb'
    const result = client.sign(REQUEST_FIXTURES.escrow.txJSON, secret)
    assert.deepEqual(result, RESPONSE_FIXTURES.escrow)
    schemaValidator.schemaValidate('sign', result)
  },

  'signAs': async (client, address) => {
    const txJSON = REQUEST_FIXTURES.signAs
    const secret = 'snoPBrXtMeMyMHUVTgbuqAfg1SUTb'
    const signature = client.sign(JSON.stringify(txJSON), secret, {
      signAs: 'rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh'
    })
    assert.deepEqual(signature, RESPONSE_FIXTURES.signAs)
  },

  'withKeypair': async (client, address) => {
    const keypair = {
      privateKey:
        '00ACCD3309DB14D1A4FC9B1DAE608031F4408C85C73EE05E035B7DC8B25840107A',
      publicKey:
        '02F89EAEC7667B30F33D0687BBA86C3FE2A08CCA40A9186C5BDE2DAA6FA97A37D8'
    }
    const result = client.sign(REQUEST_FIXTURES.normal.txJSON, keypair)
    assert.deepEqual(result, RESPONSE_FIXTURES.normal)
    schemaValidator.schemaValidate('sign', result)
  },

  'withKeypair already signed': async (client, address) => {
    const keypair = {
      privateKey:
        '00ACCD3309DB14D1A4FC9B1DAE608031F4408C85C73EE05E035B7DC8B25840107A',
      publicKey:
        '02F89EAEC7667B30F33D0687BBA86C3FE2A08CCA40A9186C5BDE2DAA6FA97A37D8'
    }
    const result = client.sign(REQUEST_FIXTURES.normal.txJSON, keypair)
    assert.throws(() => {
      const tx = JSON.stringify(binary.decode(result.signedTransaction))
      client.sign(tx, keypair)
    }, /txJSON must not contain "TxnSignature" or "Signers" properties/)
  },

  'withKeypair EscrowExecution': async (client, address) => {
    const keypair = {
      privateKey:
        '001ACAAEDECE405B2A958212629E16F2EB46B153EEE94CDD350FDEFF52795525B7',
      publicKey:
        '0330E7FC9D56BB25D6893BA3F317AE5BCF33B3291BD63DB32654A313222F7FD020'
    }
    const result = client.sign(REQUEST_FIXTURES.escrow.txJSON, keypair)
    assert.deepEqual(result, RESPONSE_FIXTURES.escrow)
    schemaValidator.schemaValidate('sign', result)
  },

  'withKeypair signAs': async (client, address) => {
    const txJSON = REQUEST_FIXTURES.signAs
    const keypair = {
      privateKey:
        '001ACAAEDECE405B2A958212629E16F2EB46B153EEE94CDD350FDEFF52795525B7',
      publicKey:
        '0330E7FC9D56BB25D6893BA3F317AE5BCF33B3291BD63DB32654A313222F7FD020'
    }
    const signature = client.sign(JSON.stringify(txJSON), keypair, {
      signAs: 'rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh'
    })
    assert.deepEqual(signature, RESPONSE_FIXTURES.signAs)
  },

  'succeeds - prepared payment': async (client, address, mockRippled) => {
    mockRippled.addResponse({command: 'server_info'}, rippled.server_info.normal)
    mockRippled.addResponse({command: 'fee'}, rippled.fee)
    mockRippled.addResponse({command: 'ledger_current'}, rippled.ledger_current)
    mockRippled.addResponse({command: 'account_info'}, rippled.account_info.normal)
    const payment = await client.preparePayment(address, {
      source: {
        address: address,
        maxAmount: {
          value: '1',
          currency: 'drops'
        }
      },
      destination: {
        address: 'rQ3PTWGLCbPz8ZCicV5tCX3xuymojTng5r',
        amount: {
          value: '1',
          currency: 'drops'
        }
      }
    })
    const secret = 'shsWGZcmZz6YsWWmcnpfr6fLTdtFV'
    const result = client.sign(payment.txJSON, secret)
    const expectedResult = {
      signedTransaction:
        '12000022800000002400000017201B008694F261400000000000000168400000000000000C732102F89EAEC7667B30F33D0687BBA86C3FE2A08CCA40A9186C5BDE2DAA6FA97A37D874473045022100A9C91D4CFAE45686146EE0B56D4C53A2E7C2D672FB834D43E0BE2D2E9106519A022075DDA2F92DE552B0C45D83D4E6D35889B3FBF51BFBBD9B25EBF70DE3C96D0D6681145E7B112523F68D2F5E879DB4EAC51C6698A693048314FDB08D07AAA0EB711793A3027304D688E10C3648',
      id: '88D6B913C66279EA31ADC25C5806C48B2D4E5680261666790A736E1961217700'
    }
    assert.deepEqual(result, expectedResult)
    schemaValidator.schemaValidate('sign', result)
  },

  'succeeds - no flags': async (client, address) => {
    const txJSON =
      '{"TransactionType":"Payment","Account":"r45Rev1EXGxy2hAUmJPCne97KUE7qyrD3j","Destination":"rQ3PTWGLCbPz8ZCicV5tCX3xuymojTng5r","Amount":"20000000","Sequence":1,"Fee":"12"}'
    const secret = 'shotKgaEotpcYsshSE39vmSnBDRim'
    const result = client.sign(txJSON, secret)
    const expectedResult = {
      signedTransaction:
        '1200002400000001614000000001312D0068400000000000000C7321022B05847086686F9D0499B13136B94AD4323EE1B67D4C429ECC987AB35ACFA34574473045022100C104B7B97C31FACA4597E7D6FCF13BD85BD11375963A62A0AC45B0061236E39802207784F157F6A98DFC85B051CDDF61CC3084C4F5750B82674801C8E9950280D1998114EE3046A5DDF8422C40DDB93F1D522BB4FE6419158314FDB08D07AAA0EB711793A3027304D688E10C3648',
      id: '0596925967F541BF332FF6756645B2576A9858414B5B363DC3D34915BE8A70D6'
    }
    const decoded = binary.decode(result.signedTransaction)
    assert(
      decoded.Flags == null,
      `Flags = ${decoded.Flags}, should be undefined`
    )
    assert.deepEqual(result, expectedResult)
    schemaValidator.schemaValidate('sign', result)
  },

  'sign succeeds with source.amount/destination.minAmount': async (
    client,
    address
  ) => {
    // See also: 'preparePayment with source.amount/destination.minAmount'

    const txJSON =
      '{"TransactionType":"Payment","Account":"r9cZA1mLK5R5Am25ArfXFmqgNwjZgnfk59","Destination":"rEX4LtGJubaUcMWCJULcy4NVxGT9ZEMVRq","Amount":{"currency":"USD","issuer":"rMaa8VLBTjwTJWA2kSme4Sqgphhr6Lr6FH","value":"999999999999999900000000000000000000000000000000000000000000000000000000000000000000000000000000"},"Flags":2147614720,"SendMax":{"currency":"GBP","issuer":"rpat5TmYjDsnFSStmgTumFgXCM9eqsWPro","value":"0.1"},"DeliverMin":{"currency":"USD","issuer":"rMaa8VLBTjwTJWA2kSme4Sqgphhr6Lr6FH","value":"0.1248548562296331"},"Sequence":23,"LastLedgerSequence":8820051,"Fee":"12"}'
    const secret = 'shotKgaEotpcYsshSE39vmSnBDRim'
    const result = client.sign(txJSON, secret)
    const expectedResult = {
      signedTransaction:
        '12000022800200002400000017201B0086955361EC6386F26FC0FFFF0000000000000000000000005553440000000000DC596C88BCDE4E818D416FCDEEBF2C8656BADC9A68400000000000000C69D4438D7EA4C6800000000000000000000000000047425000000000000C155FFE99C8C91F67083CEFFDB69EBFE76348CA6AD4446F8C5D8A5E0B0000000000000000000000005553440000000000DC596C88BCDE4E818D416FCDEEBF2C8656BADC9A7321022B05847086686F9D0499B13136B94AD4323EE1B67D4C429ECC987AB35ACFA34574473045022100D9634523D8E232D4A7807A71856023D82AC928FA29848571B820867898413B5F022041AC00EC1F81A26A6504EBF844A38CC3204694EF2CC1A97A87632721631F93DA81145E7B112523F68D2F5E879DB4EAC51C6698A6930483149F500E50C2F016CA01945E5A1E5846B61EF2D376',
      id: '1C558AA9B926C24FB6BBD6950B2DB1350A83F9F12E4385208867907019761A2D'
    }
    const decoded = binary.decode(result.signedTransaction)
    assert(
      decoded.Flags === 2147614720,
      `Flags = ${decoded.Flags}, should be 2147614720`
    )
    assert.deepEqual(result, expectedResult)
    schemaValidator.schemaValidate('sign', result)
  },

  'throws when encoded tx does not match decoded tx - prepared payment': async (
    client,
    address,
    mockRippled
  ) => {
    mockRippled.addResponse({command: 'server_info'}, rippled.server_info.normal)
    mockRippled.addResponse({command: 'fee'}, rippled.fee)
    mockRippled.addResponse({command: 'ledger_current'}, rippled.ledger_current)
    mockRippled.addResponse({command: 'account_info'}, rippled.account_info.normal)
    const payment = await client.preparePayment(address, {
      source: {
        address: address,
        maxAmount: {
          value: '1.1234567',
          currency: 'drops'
        }
      },
      destination: {
        address: 'rQ3PTWGLCbPz8ZCicV5tCX3xuymojTng5r',
        amount: {
          value: '1.1234567',
          currency: 'drops'
        }
      }
    })
    const secret = 'shsWGZcmZz6YsWWmcnpfr6fLTdtFV'
    assert.throws(() => {
      client.sign(payment.txJSON, secret)
    }, /^Error: 1\.1234567 is an illegal amount/)
  },

  'throws when encoded tx does not match decoded tx - prepared order': async (
    client,
    address,
    mockRippled
  ) => {
    mockRippled.addResponse({command: 'server_info'}, rippled.server_info.normal)
    mockRippled.addResponse({command: 'fee'}, rippled.fee)
    mockRippled.addResponse({command: 'ledger_current'}, rippled.ledger_current)
    mockRippled.addResponse({command: 'account_info'}, rippled.account_info.normal)
    const order = {
      direction: 'sell',
      quantity: {
        currency: 'USD',
        counterparty: 'rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B',
        value: '3.140000'
      },
      totalPrice: {
        currency: 'XRP',
        value: '31415'
      }
    }
    const prepared = await client.prepareOrder(address, order, {sequence: 123})
    const secret = 'shsWGZcmZz6YsWWmcnpfr6fLTdtFV'
    try {
      client.sign(prepared.txJSON, secret)
      return Promise.reject(new Error('client.sign should have thrown'))
    } catch (error) {
      assert.equal(error.name, 'ValidationError')
      assert.equal(
        error.message,
        'Serialized transaction does not match original txJSON. See `error.data`'
      )
      assert.deepEqual(error.data.diff, {
        TakerGets: {
          value: '3.14'
        }
      })
    }
  },

  'throws when encoded tx does not match decoded tx - AccountSet': async (
    client,
    address
  ) => {
    const secret = 'shsWGZcmZz6YsWWmcnpfr6fLTdtFV'
    const request = {
      // TODO: This fails when address is X-address
      txJSON: `{"Flags":2147483648,"TransactionType":"AccountSet","Account":"r9cZA1mLK5R5Am25ArfXFmqgNwjZgnfk59","Domain":"6578616D706C652E636F6D","LastLedgerSequence":8820051,"Fee":"1.2","Sequence":23,"SigningPubKey":"02F89EAEC7667B30F33D0687BBA86C3FE2A08CCA40A9186C5BDE2DAA6FA97A37D8"}`,
      instructions: {
        fee: '0.0000012',
        sequence: 23,
        maxLedgerVersion: 8820051
      }
    }

    assert.throws(() => {
      client.sign(request.txJSON, secret)
    }, /Error: 1\.2 is an illegal amount/)
  },

  'throws when encoded tx does not match decoded tx - higher fee': async (
    client,
    address
  ) => {
    const secret = 'shsWGZcmZz6YsWWmcnpfr6fLTdtFV'
    const request = {
      // TODO: This fails when address is X-address
      txJSON: `{"Flags":2147483648,"TransactionType":"AccountSet","Account":"r9cZA1mLK5R5Am25ArfXFmqgNwjZgnfk59","Domain":"6578616D706C652E636F6D","LastLedgerSequence":8820051,"Fee":"1123456.7","Sequence":23,"SigningPubKey":"02F89EAEC7667B30F33D0687BBA86C3FE2A08CCA40A9186C5BDE2DAA6FA97A37D8"}`,
      instructions: {
        fee: '1.1234567',
        sequence: 23,
        maxLedgerVersion: 8820051
      }
    }

    assert.throws(() => {
      client.sign(request.txJSON, secret)
    }, /Error: 1123456\.7 is an illegal amount/)
  },

  'throws when Fee exceeds maxFeeXRP (in drops)': async (client, address) => {
    const secret = 'shsWGZcmZz6YsWWmcnpfr6fLTdtFV'
    const request = {
      txJSON: `{"Flags":2147483648,"TransactionType":"AccountSet","Account":"${address}","Domain":"6578616D706C652E636F6D","LastLedgerSequence":8820051,"Fee":"2010000","Sequence":23,"SigningPubKey":"02F89EAEC7667B30F33D0687BBA86C3FE2A08CCA40A9186C5BDE2DAA6FA97A37D8"}`,
      instructions: {
        fee: '2.01',
        sequence: 23,
        maxLedgerVersion: 8820051
      }
    }

    assert.throws(() => {
      client.sign(request.txJSON, secret)
    }, /Fee" should not exceed "2000000"\. To use a higher fee, set `maxFeeXRP` in the Client constructor\./)
  },

  'throws when Fee exceeds maxFeeXRP (in drops) - custom maxFeeXRP': async (
    client,
    address
  ) => {
    client._maxFeeXRP = '1.9'
    const secret = 'shsWGZcmZz6YsWWmcnpfr6fLTdtFV'
    const request = {
      txJSON: `{"Flags":2147483648,"TransactionType":"AccountSet","Account":"${address}","Domain":"6578616D706C652E636F6D","LastLedgerSequence":8820051,"Fee":"2010000","Sequence":23,"SigningPubKey":"02F89EAEC7667B30F33D0687BBA86C3FE2A08CCA40A9186C5BDE2DAA6FA97A37D8"}`,
      instructions: {
        fee: '2.01',
        sequence: 23,
        maxLedgerVersion: 8820051
      }
    }

    assert.throws(() => {
      client.sign(request.txJSON, secret)
    }, /Fee" should not exceed "1900000"\. To use a higher fee, set `maxFeeXRP` in the Client constructor\./)
  },

  'permits fee exceeding 2000000 drops when maxFeeXRP is higher than 2 XRP': async (
    client,
    address
  ) => {
    client._maxFeeXRP = '2.1'
    const secret = 'shsWGZcmZz6YsWWmcnpfr6fLTdtFV'
    const request = {
      // TODO: This fails when address is X-address
      txJSON: `{"Flags":2147483648,"TransactionType":"AccountSet","Account":"r9cZA1mLK5R5Am25ArfXFmqgNwjZgnfk59","LastLedgerSequence":8820051,"Fee":"2010000","Sequence":23,"SigningPubKey":"02F89EAEC7667B30F33D0687BBA86C3FE2A08CCA40A9186C5BDE2DAA6FA97A37D8"}`,
      instructions: {
        fee: '2.01',
        sequence: 23,
        maxLedgerVersion: 8820051
      }
    }

    const result = client.sign(request.txJSON, secret)

    const expectedResponse = {
      signedTransaction:
        '12000322800000002400000017201B008695536840000000001EAB90732102F89EAEC7667B30F33D0687BBA86C3FE2A08CCA40A9186C5BDE2DAA6FA97A37D87446304402200203F219F5371D2C6506888B1B02B27E74998F7A42D412C32FE319AC1A5B8DEF02205959A1B02253ACCCE542759E9886466C56D16B04676FA492AD34AA0E877E91F381145E7B112523F68D2F5E879DB4EAC51C6698A69304',
      id: '061D5593E0A117F389826419CAC049A73C7CFCA65A20B788781D41240143D864'
    }

    assert.deepEqual(result, expectedResponse)
    schemaValidator.schemaValidate('sign', result)
  },

  'sign with ticket': async (client, address) => {
    const secret = 'sn7n5R1cR5Y3fRFkuWXA94Ts1frVJ'
    const result = client.sign(REQUEST_FIXTURES.ticket.txJSON, secret)
    assert.deepEqual(result, RESPONSE_FIXTURES.ticket)
    schemaValidator.schemaValidate('sign', result)
  }
}
