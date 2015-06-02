'use strict';

/*eslint-disable max-len */
/*eslint-disable no-multi-spaces */
/*eslint-disable indent */
/*eslint-disable new-cap */
/*eslint max-nested-callbacks: [1, 5]*/
const assert = require('assert');
const extend = require('extend');
const ripple = require('ripple-lib');

const SerializedObject = ripple.SerializedObject;
const keypairs = ripple.keypairs;
const Transaction = ripple.Transaction;
const utils = ripple.utils;
const sjcl = ripple.sjcl;

const getKeyPair = keypairs.getKeyPair;
const KeyType = keypairs.KeyType;

function deepCopy(obj) {
  return extend(true, {}, obj);
}

const fixtures = {
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
      const pair = getKeyPair('niq');
      const pair2 = getKeyPair(pair);
      assert(pair === pair2);
    });
  });
  describe('constructing via a generic String `secret`', function() {
    const pair = getKeyPair('niq');
    it('defaults to secp256k1', function() {
      assert.equal(pair.type, KeyType.secp256k1);
    });
/*    it('will have a Seed `seed` member', function() {
      assert(pair.seed instanceof Seed);
    });
    it('the seed generated will be as if ' +
       'passed to `wallet_propose`', function() {
      assert.equal(pair.seed.to_json(), 'shQUG1pmPYrcnSUGeuJFJTA1b3JSL');
    });
*/  });
});

describe('Secp256k1Pair', function() {
  it('can verify a TxnSignature', function() {
    const tx_json = {
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
    const sig = '3045022100AF5EEA5B62463F80E1C01D05D' +
          '1D913B5E02693550ED724EDB02FBC55322E' +
          '5A250220185D7C6E93EC15B8EFBDA5C0721' +
          '9DB553EEBA22DDBA1012DD93CA1621D1BB433';

    const pair = getKeyPair('niq');
    const prefix = [0x53, 0x54, 0x58, 0x00];
    const so = SerializedObject.from_json(tx_json, prefix);
    const verified = pair.verify(so.buffer, utils.hexToArray(sig));
    assert(verified);
  });

  describe('generated tests', function() {
    const expected = [
      '30440220312b2e0894b81a2e070ace566c5dfc70cdd18e67d44e2cfef2eb5495f7de2dac02205e155c0019502948c265209dfdd7d84c4a05bd2c38cee6ecd7c33e9c9b12bec2',
      '304402202a5860a12c15ebb8e91aa83f8e19d85d4ac05b272fc0c4083519339a7a76f2b802200852f9889e1284cf407dc7f73d646e62044c5ab432eaef3fff3f6f8ee9a0f24c',
      '3045022100b1658c88d1860d9f8beb25b79b3e5137bbc2c382d08fe7a068ffc6ab8978c8040220644f64b97ea144ee7d5ccb71c2372dd730fa0a659e4c18241a80d6c915350263',
      '3045022100f3e541330ff79ffc42eb0491ede1e47106d94ecfe3cdb2d9dd3bc0e8861f6d45022013f62942dd626d6c9731e317f372ec5c1f72885c4727fdbee9d9321bc530d7b2',
      '3045022100998abe378f4119d8bee9843482c09f0d5ce5c6012921548182454c610c57a269022036bd8eb71235c4b2c67339de6a59746b1f7e5975987b7ab99b313d124a69bb9f'
    ];
    const pair = getKeyPair({
      passphrase: 'niq'
    });
    function test_factory(i) {
      it('can deterministically sign/verify message [' + i +
                       ']', function() {
        const message = [i];
        const sig = pair.sign(message);
        // assert.equal(utils.arrayToHex(sig), expected[i]);
        assert(pair.verify(message, sig));
      });
    }

    for (let n = 0; n < 5; n++) {
      test_factory(n);
    }
  });
});

describe('ED25519Pair', function() {
  const pair = getKeyPair({
    key_type: 'ed25519',
    passphrase: 'niq'
  });
  it('has a String member `type` equal to KeyPair.ed25519 constant',
      function() {
    assert.equal(pair.type, KeyType.ed25519);
  });
  it('has a public key representation beginning with ED', function() {
    const pub_hex = pair.pubKeyHex();
    assert(pub_hex.length === 66);
    assert(pub_hex.slice(0, 2) === 'ED');
  });
  it('derives the same keypair for a given passphrase as rippled', function() {
    const pub_hex = pair.pubKeyHex();
    const target_hex = 'EDD3993CDC6647896C455F136648B7750' +
                   '723B011475547AF60691AA3D7438E021D';
    assert.equal(pub_hex, target_hex);
  });
  it('generates the same account_id as rippled for a given keypair',
      function() {
    assert.equal(pair.account().to_json(),
                 'rJZdUusLDtY9NEsGea7ijqhVrXv98rYBYN');
  });
  it('creates signatures that are a function of secret/message', function() {
    const signature = pair.sign(fixtures.message);
    assert(Array.isArray(signature));
    assert(pair.verify(fixtures.message, signature));
  });
  it('signs transactions exactly as rippled', function() {
    const so = SerializedObject.from_json(fixtures.tx_json);
    const message = [0x53, 0x54, 0x58, 0x00].concat(so.buffer);
    const sig = pair.signHex(message);
    assert.equal(sig, fixtures.tx_json.expected_sig);
  });
});

describe('Transaction integration', function() {
  function tx_json() {
    return {
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
  }

  describe('remote.setSecret(account, getKeyPair(...))', function() {
    it('can sign a transaction', function() {
      const remote = new ripple.Remote();
      const keypair = getKeyPair('niq');
      const tx = remote.transaction();
      tx.tx_json = tx_json();
      remote.setSecret(tx.tx_json.Account, keypair);

      // We don't as yet have a signature
      assert(!tx.tx_json.TxnSignature);

      // Transaction#complete needs to be called, as that is where the secret is
      // set on the transaction, for later finding by Transaction#sign
      assert(!tx._secret);
      tx.complete();
      assert(tx._secret);

      tx.sign();
      assert(tx.tx_json.TxnSignature);
    });
  });
  describe('tx.setSecret(getKeyPair(...))', function() {
    it('can sign a transaction', function() {
      const tx = Transaction.from_json(tx_json());
      tx.setSecret(getKeyPair('niq'));
      assert(!tx.tx_json.TxnSignature);
      tx.sign();
      assert.equal('string', typeof tx.tx_json.TxnSignature);
    });
  });
  describe('allows setting keypair specifiers via `tx._secret`',
      function() {
    it('allows objects such as {key_type: \'ed25519\', passphrase: \'niq\'}',
        function() {
      const tx = Transaction.from_json(deepCopy(fixtures.tx_json));
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
      const tx = Transaction.from_json(tx_json());
      tx._secret = 'niq';
      assert(!tx.tx_json.TxnSignature);
      tx.sign();
      assert.equal('string', typeof tx.tx_json.TxnSignature);
    });
  });
});
