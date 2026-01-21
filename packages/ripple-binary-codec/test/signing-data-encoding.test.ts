import { XrplDefinitions } from '../src/enums/xrpl-definitions'
import {
  encodeForSigning,
  encodeForSigningClaim,
  encodeForMultisigning,
  encodeForSigningBatch,
} from '../src'

const normalDefinitions = require('../src/enums/definitions.json')

const tx_json = {
  Account: 'r9LqNeG6qHxjeUocjvVki2XR35weJ9mZgQ',
  Amount: '1000',
  Destination: 'rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh',
  Fee: '10',
  Flags: 2147483648,
  Sequence: 1,
  TransactionType: 'Payment',
  TxnSignature:
    '30440220718D264EF05CAED7C781FF6DE298DCAC68D002562C9BF3A07C1' +
    'E721B420C0DAB02203A5A4779EF4D2CCC7BC3EF886676D803A9981B928D3B8ACA483B80' +
    'ECA3CD7B9B',
  Signature:
    '30440220718D264EF05CAED7C781FF6DE298DCAC68D002562C9BF3A07C1E72' +
    '1B420C0DAB02203A5A4779EF4D2CCC7BC3EF886676D803A9981B928D3B8ACA483B80ECA' +
    '3CD7B9B',
  SigningPubKey:
    'ED5F5AC8B98974A3CA843326D9B88CEBD0560177B973EE0B149F782CFAA06DC66A',
}

const multiSigningTxJson = {
  TransactionType: 'LoanSet',
  Flags: 0,
  Sequence: 3606,
  LastLedgerSequence: 3634,
  LoanBrokerID:
    'B91CD2033E73E0DD17AF043FBD458CE7D996850A83DCED23FB122A3BFAA7F430',
  Fee: '12',
  SigningPubKey:
    'EDCEDEBC063D32FD4327C272ED2C46851129C47BE41FCA4222D4D94205AB1B587B',
  TxnSignature:
    'CCF8287A8A8EC0CF47C67219639C2F7BC7E7FCF2648FD328A518E9B9FA05ADB9A28A6EFB02D17A776DAEE5D1E25623FFBEFC06B5BBC1F77104188602F865A70F',
  Account: 'rHLLL3Z7uBLK49yZcMaj8FAP7DU12Nw5A5',
  PrincipalRequested: '100000',
}

describe('Signing data', function () {
  it('can create single signing blobs', function () {
    const actual = encodeForSigning(tx_json)
    expect(actual).toBe(
      [
        '53545800', // signingPrefix
        // TransactionType
        '12',
        '0000',
        // Flags
        '22',
        '80000000',
        // Sequence
        '24',
        '00000001',
        // Amount
        '61',
        // native amount
        '40000000000003E8',
        // Fee
        '68',
        // native amount
        '400000000000000A',
        // SigningPubKey
        '73',
        // VLLength
        '21',
        'ED5F5AC8B98974A3CA843326D9B88CEBD0560177B973EE0B149F782CFAA06DC66A',
        // Account
        '81',
        // VLLength
        '14',
        '5B812C9D57731E27A2DA8B1830195F88EF32A3B6',
        // Destination
        '83',
        // VLLength
        '14',
        'B5F762798A53D543A014CAF8B297CFF8F2F937E8',
      ].join(''),
    )
  })

  it('can create single signing blobs with modified type', function () {
    const customPaymentDefinitions = JSON.parse(
      JSON.stringify(normalDefinitions),
    )

    // custom number would need to updated in case it has been used by an existing transaction type
    customPaymentDefinitions.TRANSACTION_TYPES.Payment = 200

    const newDefs = new XrplDefinitions(customPaymentDefinitions)
    const actual = encodeForSigning(tx_json, newDefs)
    expect(actual).toBe(
      [
        '53545800', // signingPrefix
        // TransactionType
        '12',
        '00C8',
        // Flags
        '22',
        '80000000',
        // Sequence
        '24',
        '00000001',
        // Amount
        '61',
        // native amount
        '40000000000003E8',
        // Fee
        '68',
        // native amount
        '400000000000000A',
        // SigningPubKey
        '73',
        // VLLength
        '21',
        'ED5F5AC8B98974A3CA843326D9B88CEBD0560177B973EE0B149F782CFAA06DC66A',
        // Account
        '81',
        // VLLength
        '14',
        '5B812C9D57731E27A2DA8B1830195F88EF32A3B6',
        // Destination
        '83',
        // VLLength
        '14',
        'B5F762798A53D543A014CAF8B297CFF8F2F937E8',
      ].join(''),
    )
  })

  it('can fail gracefully for invalid TransactionType', function () {
    const invalidTransactionType = {
      ...tx_json,
      TransactionType: 'NotAPayment',
    }

    expect(() => encodeForSigning(invalidTransactionType)).toThrow(
      new TypeError('Unable to interpret "TransactionType: NotAPayment".'),
    )
  })

  it('can create multi signing blobs', function () {
    const signingAccount = 'rJZdUusLDtY9NEsGea7ijqhVrXv98rYBYN'
    const signingJson = { ...tx_json, SigningPubKey: '' }
    const actual = encodeForMultisigning(signingJson, signingAccount)
    expect(actual).toBe(
      [
        '534D5400', // signingPrefix
        // TransactionType
        '12',
        '0000',
        // Flags
        '22',
        '80000000',
        // Sequence
        '24',
        '00000001',
        // Amount
        '61',
        // native amount
        '40000000000003E8',
        // Fee
        '68',
        // native amount
        '400000000000000A',
        // SigningPubKey
        '73',
        // VLLength
        '00',
        // '',
        // Account
        '81',
        // VLLength
        '14',
        '5B812C9D57731E27A2DA8B1830195F88EF32A3B6',
        // Destination
        '83',
        // VLLength
        '14',
        'B5F762798A53D543A014CAF8B297CFF8F2F937E8',
        // signingAccount suffix
        'C0A5ABEF242802EFED4B041E8F2D4A8CC86AE3D1',
      ].join(''),
    )
  })

  it('can create multi signing blobs with non-empty SigningPubKey', function () {
    const signingAccount = 'rJ73aumLPTQQmy5wnGhvrogqf5DDhjuzc9'
    const actual = encodeForMultisigning(multiSigningTxJson, signingAccount)
    expect(actual).toBe(
      [
        '534D5400', // signingPrefix
        // TransactionType
        '12',
        '0050', // LoanSet = 80
        // Flags
        '22',
        '00000000',
        // Sequence
        '24',
        '00000E16', // 3606
        // LastLedgerSequence
        '201B',
        '00000E32', // 3634
        // LoanBrokerID
        '5025',
        'B91CD2033E73E0DD17AF043FBD458CE7D996850A83DCED23FB122A3BFAA7F430',
        // Fee
        '68',
        // native amount
        '400000000000000C',
        // SigningPubKey
        '73',
        // VLLength
        '21', // 33 bytes
        'EDCEDEBC063D32FD4327C272ED2C46851129C47BE41FCA4222D4D94205AB1B587B',
        // Account
        '81',
        // VLLength
        '14',
        'B32A0D322D38281C81D4F49DCCDC260A81879B57',
        // PrincipalRequested
        '9E',
        '00038D7EA4C68000FFFFFFF6',
        // signingAccount suffix
        'BF9B4C3302798C111649BFA38DB60525C6E1021C',
      ].join(''),
    )
  })

  it('can create multi signing blobs with custom definitions', function () {
    const customPaymentDefinitions = JSON.parse(
      JSON.stringify(normalDefinitions),
    )

    // custom number would need to updated in case it has been used by an existing transaction type
    customPaymentDefinitions.TRANSACTION_TYPES.Payment = 200

    const newDefs = new XrplDefinitions(customPaymentDefinitions)
    const signingAccount = 'rJZdUusLDtY9NEsGea7ijqhVrXv98rYBYN'
    const signingJson = { ...tx_json, SigningPubKey: '' }
    const actual = encodeForMultisigning(signingJson, signingAccount, newDefs)
    expect(actual).toBe(
      [
        '534D5400', // signingPrefix
        // TransactionType
        '12',
        '00C8',
        // Flags
        '22',
        '80000000',
        // Sequence
        '24',
        '00000001',
        // Amount
        '61',
        // native amount
        '40000000000003E8',
        // Fee
        '68',
        // native amount
        '400000000000000A',
        // SigningPubKey
        '73',
        // VLLength
        '00',
        // '',
        // Account
        '81',
        // VLLength
        '14',
        '5B812C9D57731E27A2DA8B1830195F88EF32A3B6',
        // Destination
        '83',
        // VLLength
        '14',
        'B5F762798A53D543A014CAF8B297CFF8F2F937E8',
        // signingAccount suffix
        'C0A5ABEF242802EFED4B041E8F2D4A8CC86AE3D1',
      ].join(''),
    )
  })

  it('can create claim blob', function () {
    const channel =
      '43904CBFCDCEC530B4037871F86EE90BF799DF8D2E0EA564BC8A3F332E4F5FB1'
    const amount = '1000'
    const json = { channel, amount }
    const actual = encodeForSigningClaim(json)
    expect(actual).toBe(
      [
        // hash prefix
        '434C4D00',
        // channel ID
        '43904CBFCDCEC530B4037871F86EE90BF799DF8D2E0EA564BC8A3F332E4F5FB1',
        // amount as a uint64
        '00000000000003E8',
      ].join(''),
    )
  })

  it('can create batch blob', function () {
    const flags = 1
    const txIDs = [
      'ABE4871E9083DF66727045D49DEEDD3A6F166EB7F8D1E92FE868F02E76B2C5CA',
      '795AAC88B59E95C3497609749127E69F12958BC016C600C770AEEB1474C840B4',
    ]
    const json = { flags, txIDs }
    const actual = encodeForSigningBatch(json)
    expect(actual).toBe(
      [
        // hash prefix
        '42434800',
        // flags
        '00000001',
        // txIds length
        '00000002',
        // txIds
        'ABE4871E9083DF66727045D49DEEDD3A6F166EB7F8D1E92FE868F02E76B2C5CA',
        '795AAC88B59E95C3497609749127E69F12958BC016C600C770AEEB1474C840B4',
      ].join(''),
    )
  })

  it('encodeForSigningBatch fails on non-object', function () {
    const flags = 1
    // @ts-expect-error - testing invalid input for JS users
    expect(() => encodeForSigningBatch(flags)).toThrow(
      new Error('Need an object to encode a Batch transaction'),
    )
  })
})
