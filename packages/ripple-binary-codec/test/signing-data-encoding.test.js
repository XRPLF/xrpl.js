const {
  encodeForSigning,
  encodeForSigningClaim,
  encodeForMultisigning,
} = require('../dist')

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

describe('Signing data', function () {
  test('can create single signing blobs', function () {
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
  test('can create multi signing blobs', function () {
    const signingAccount = 'rJZdUusLDtY9NEsGea7ijqhVrXv98rYBYN'
    const signingJson = Object.assign({}, tx_json, { SigningPubKey: '' })
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
  test('can create claim blob', function () {
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
})
