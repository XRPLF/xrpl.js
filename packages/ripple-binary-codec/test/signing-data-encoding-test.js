'use strict';

const _ = require('lodash');
const assert = require('assert-diff');
const {encodeForSigning, encodeForMultisigning} = require('../src');

const tx_json = {
  Account: 'r9LqNeG6qHxjeUocjvVki2XR35weJ9mZgQ',
  Amount: '1000',
  Destination: 'rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh',
  Fee: '10',
  Flags: 2147483648,
  Sequence: 1,
  TransactionType: 'Payment',
  SigningPubKey:
    'ED5F5AC8B98974A3CA843326D9B88CEBD0560177B973EE0B149F782CFAA06DC66A'
};

describe('Signing data', function() {
  it('can create single signing blobs', function() {
    const actual = encodeForSigning(tx_json);
    assert.equal(actual,
          ['53545800', // signingPrefix
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
          'B5F762798A53D543A014CAF8B297CFF8F2F937E8'].join('')
      );
  });
  it('can create multi signing blobs', function() {
    const signingAccount = 'rJZdUusLDtY9NEsGea7ijqhVrXv98rYBYN';
    const signingJson = _.assign({}, tx_json, {SigningPubKey: ''});
    const actual = encodeForMultisigning(signingJson, signingAccount);
    assert.equal(actual,
          ['534D5400', // signingPrefix
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
          'C0A5ABEF242802EFED4B041E8F2D4A8CC86AE3D1'].join('')
      );
  });
});
