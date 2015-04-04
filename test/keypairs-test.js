'use strict';

/*eslint max-nested-callbacks: [1, 5]*/
var assert = require('assert');
var extend = require('extend');
var ripple = require('ripple-lib');

var SerializedObject = ripple.SerializedObject;
var Seed = ripple.Seed;
var keypairs = ripple.keypairs;
var Transaction = ripple.Transaction;
var utils = ripple.utils;

var getKeyPair = keypairs.getKeyPair;
var KeyType = keypairs.KeyType;

function deepCopy(obj) {
  return extend(true, {}, obj);
}

var fixtures = {
  message: [0xB, 0xE, 0xE, 0xF],
  tx_json: {
    Account: 'rJZdUusLDtY9NEsGea7ijqhVrXv98rYBYN',
    Amount: '1000',
    Destination: 'rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh',
    Fee: '10',
    Flags: 2147483648,
    Sequence: 1,
    SigningPubKey: 'EDD3993CDC6647896C455F136648B7750' +
                   '723B011475547AF60691AA3D7438E021D',
    TransactionType: 'Payment',
    expected_sig: 'C3646313B08EED6AF4392261A31B961F' +
                  '10C66CB733DB7F6CD9EAB079857834C8' +
                  'B0334270A2C037E63CDCCC1932E08328' +
                  '82B7B7066ECD2FAEDEB4A83DF8AE6303'
  }
};

describe('getKeyPair', function() {
  describe('a KeyPair itself can be used as a specifier', function() {
    it('returns the KeyPair passed in', function() {
      var pair = getKeyPair('niq');
      var pair2 = getKeyPair(pair);
      assert(pair === pair2);
    });
  });
  describe('constructing via a generic String `secret`', function() {
    var pair = getKeyPair('niq');
    it('defaults to secp256k1', function() {
      assert.equal(pair.type, KeyType.secp256k1);
    });
    it('will have a Seed `seed` member', function() {
      assert(pair.seed instanceof Seed);
    });
    it('the seed generated will be as if ' +
       'passed to `wallet_propose`', function() {
      assert.equal(pair.seed.to_json(), 'shQUG1pmPYrcnSUGeuJFJTA1b3JSL');
    });
  });
});

describe('Secp256k1Pair', function() {
  it('can verify a TxnSignature', function() {
    var tx_json = {
      'Account': 'rNvfq2SVbCiio1zkN5WwLQW8CHgy2dUoQi',
      'Amount': '1000',
      'Destination': 'rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh',
      'Fee': '10',
      'Flags': 2147483648,
      'Sequence': 1,
      'SigningPubKey':
        '021E788CDEB9104C9179C3869250A89999C1AFF92D2C3FF7925A1696835EA3D840',
      'TransactionType': 'Payment'
    };
    var sig = '3045022100AF5EEA5B62463F80E1C01D05D' +
          '1D913B5E02693550ED724EDB02FBC55322E' +
          '5A250220185D7C6E93EC15B8EFBDA5C0721' +
          '9DB553EEBA22DDBA1012DD93CA1621D1BB433';

    var pair = getKeyPair('niq');
    var prefix = [0x53, 0x54, 0x58, 0x00];
    var so = SerializedObject.from_json(tx_json, prefix);
    var verified = pair.verify(so.buffer, utils.hexToArray(sig));
    assert(verified);
  });
  describe('generated tests', function() {
    var pair = getKeyPair({
      key_type: 'ed25519',
      passphrase: 'niq'
    });
    function test_factory(i) {
      it('can sign/verify message [' + i +
                       ']', function() {
        var message = [i];
        var sig = pair.sign(message);
        assert(pair.verify(message, sig));
      });
    }

    for (var n = 0; n < 5; n++) {
      test_factory(n);
    }
  });
});

describe('ED25519Pair', function() {
  var pair = getKeyPair({
    key_type: 'ed25519',
    passphrase: 'niq'
  });
  it('has a String member `type` equal to KeyPair.ed25519 constant',
      function() {
    assert.equal(pair.type, KeyType.ed25519);
  });
  it('has a public key representation beginning with ED', function() {
    var pub_hex = pair.pubKeyHex();
    assert(pub_hex.length === 66);
    assert(pub_hex.slice(0, 2) === 'ED');
  });
  it('derives the same keypair for a given passphrase as rippled', function() {
    var pub_hex = pair.pubKeyHex();
    var target_hex = 'EDD3993CDC6647896C455F136648B7750' +
                   '723B011475547AF60691AA3D7438E021D';
    assert.equal(pub_hex, target_hex);
  });
  it('generates the same account_id as rippled for a given keypair',
      function() {
    assert.equal(pair.account().to_json(),
                 'rJZdUusLDtY9NEsGea7ijqhVrXv98rYBYN');
  });
  it('creates signatures that are a function of secret/message', function() {
    var signature = pair.sign(fixtures.message);
    assert(Array.isArray(signature));
    assert(pair.verify(fixtures.message, signature));
  });
  it('signs transactions exactly as rippled', function() {
    var so = SerializedObject.from_json(fixtures.tx_json);
    var message = [0x53, 0x54, 0x58, 0x00].concat(so.buffer);
    var sig = pair.signHex(message);
    assert.equal(sig, fixtures.tx_json.expected_sig);
  });
});

describe('Transaction integration', function() {
  describe('allows setting keypair specifiers as via `tx._secret`',
      function() {
    it('allows objects such as {key_type: "ed25519", passphrase: "niq"}',
        function() {
      var tx = Transaction.from_json(deepCopy(fixtures.tx_json));
      tx._secret = {
        key_type: 'ed25519',
        passphrase: 'niq'
      };
      assert(!tx.previousSigningData);
      tx.sign();
      assert.equal(tx.tx_json.TxnSignature, fixtures.tx_json.expected_sig);
      assert(tx.previousSigningData);
      tx.sign();
    });
    it('honours old style generic `secret`s (secp256k1)', function() {
      var tx_json = {
        Account: 'rNvfq2SVbCiio1zkN5WwLQW8CHgy2dUoQi',
        Amount: '1000',
        Destination: 'rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh',
        Fee: '10',
        Flags: 2147483648,
        Sequence: 1,
        TransactionType: 'Payment',
        SigningPubKey:
          '021E788CDEB9104C9179C3869250A89999C1AFF92D2C3FF7925A1696835EA3D840'
      };
      var tx = Transaction.from_json(deepCopy(tx_json));
      tx._secret = 'niq';
      assert(!tx.tx_json.TxnSignature);
      tx.sign();
      assert.equal('string', typeof tx.tx_json.TxnSignature);
    });
  });
});
