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
  },

  'rfc6979': [
    {
      'message': 'test data',
      'd': 'fee0a1f7afebf9d2a5a80c0c98a31c709681cce195cbcd06342b517970c0be1e',
      'k0': 'fcce1de7a9bcd6b2d3defade6afa1913fb9229e3b7ddf4749b55c4848b2a196e',
      'k1': '727fbcb59eb48b1d7d46f95a04991fc512eb9dbf9105628e3aec87428df28fd8',
      'k15': '398f0e2c9f79728f7b3d84d447ac3a86d8b2083c8f234a0ffa9c4043d68bd258'
    },
    {
      'message': 'Everything should be made as simple as possible, but not simpler.',
      'd': '0000000000000000000000000000000000000000000000000000000000000001',
      'k0': 'ec633bd56a5774a0940cb97e27a9e4e51dc94af737596a0c5cbb3d30332d92a5',
      'k1': 'df55b6d1b5c48184622b0ead41a0e02bfa5ac3ebdb4c34701454e80aabf36f56',
      'k15': 'def007a9a3c2f7c769c75da9d47f2af84075af95cadd1407393dc1e26086ef87'
    },
    {
      'message': 'Satoshi Nakamoto',
      'd': '0000000000000000000000000000000000000000000000000000000000000002',
      'k0': 'd3edc1b8224e953f6ee05c8bbf7ae228f461030e47caf97cde91430b4607405e',
      'k1': 'f86d8e43c09a6a83953f0ab6d0af59fb7446b4660119902e9967067596b58374',
      'k15': '241d1f57d6cfd2f73b1ada7907b199951f95ef5ad362b13aed84009656e0254a'
    },
    {
      'message': 'Diffie Hellman',
      'd': '7f7f7f7f7f7f7f7f7f7f7f7f7f7f7f7f7f7f7f7f7f7f7f7f7f7f7f7f7f7f7f7f',
      'k0': 'c378a41cb17dce12340788dd3503635f54f894c306d52f6e9bc4b8f18d27afcc',
      'k1': '90756c96fef41152ac9abe08819c4e95f16da2af472880192c69a2b7bac29114',
      'k15': '7b3f53300ab0ccd0f698f4d67db87c44cf3e9e513d9df61137256652b2e94e7c'
    },
    {
      'message': 'Japan',
      'd': '8080808080808080808080808080808080808080808080808080808080808080',
      'k0': 'f471e61b51d2d8db78f3dae19d973616f57cdc54caaa81c269394b8c34edcf59',
      'k1': '6819d85b9730acc876fdf59e162bf309e9f63dd35550edf20869d23c2f3e6d17',
      'k15': 'd8e8bae3ee330a198d1f5e00ad7c5f9ed7c24c357c0a004322abca5d9cd17847'
    },
    {
      'message': 'Bitcoin',
      'd': 'fffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364140',
      'k0': '36c848ffb2cbecc5422c33a994955b807665317c1ce2a0f59c689321aaa631cc',
      'k1': '4ed8de1ec952a4f5b3bd79d1ff96446bcd45cabb00fc6ca127183e14671bcb85',
      'k15': '56b6f47babc1662c011d3b1f93aa51a6e9b5f6512e9f2e16821a238d450a31f8'
    },
    {
      'message': 'i2FLPP8WEus5WPjpoHwheXOMSobUJVaZM1JPMQZq',
      'd': 'fffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364140',
      'k0': '6e9b434fcc6bbb081a0463c094356b47d62d7efae7da9c518ed7bac23f4e2ed6',
      'k1': 'ae5323ae338d6117ce8520a43b92eacd2ea1312ae514d53d8e34010154c593bb',
      'k15': '3eaa1b61d1b8ab2f1ca71219c399f2b8b3defa624719f1e96fe3957628c2c4ea'
    },
    {
      'message': 'lEE55EJNP7aLrMtjkeJKKux4Yg0E8E1SAJnWTCEh',
      'd': '3881e5286abc580bb6139fe8e83d7c8271c6fe5e5c2d640c1f0ed0e1ee37edc9',
      'k0': '5b606665a16da29cc1c5411d744ab554640479dd8abd3c04ff23bd6b302e7034',
      'k1': 'f8b25263152c042807c992eacd2ac2cc5790d1e9957c394f77ea368e3d9923bd',
      'k15': 'ea624578f7e7964ac1d84adb5b5087dd14f0ee78b49072aa19051cc15dab6f33'
    },
    {
      'message': '2SaVPvhxkAPrayIVKcsoQO5DKA8Uv5X/esZFlf+y',
      'd': '7259dff07922de7f9c4c5720d68c9745e230b32508c497dd24cb95ef18856631',
      'k0': '3ab6c19ab5d3aea6aa0c6da37516b1d6e28e3985019b3adb388714e8f536686b',
      'k1': '19af21b05004b0ce9cdca82458a371a9d2cf0dc35a813108c557b551c08eb52e',
      'k15': '117a32665fca1b7137a91c4739ac5719fec0cf2e146f40f8e7c21b45a07ebc6a'
    },
    {
      'message': '00A0OwO2THi7j5Z/jp0FmN6nn7N/DQd6eBnCS+/b',
      'd': '0d6ea45d62b334777d6995052965c795a4f8506044b4fd7dc59c15656a28f7aa',
      'k0': '79487de0c8799158294d94c0eb92ee4b567e4dc7ca18addc86e49d31ce1d2db6',
      'k1': '9561d2401164a48a8f600882753b3105ebdd35e2358f4f808c4f549c91490009',
      'k15': 'b0d273634129ff4dbdf0df317d4062a1dbc58818f88878ffdb4ec511c77976c0'
    }
  ]
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

  describe('rfc6979 deterministic k', function() {
    fixtures.rfc6979.forEach(function(f) {
     it('produces the expected k values for ' + f.message +
         ' if k wasn\'t suitable', function() {

       const d = new sjcl.bn(f.d);
       const secret = new sjcl.ecc.ecdsa.secretKey(sjcl.ecc.curves.k256, d);
       const h1 = sjcl.hash.sha256.hash(f.message);
       const results = [];

       secret.generateDeterministicK(h1, function(k) {
         results.push(k);
         return results.length === 16;
       });

       assert.equal(results[0].toString().slice(2), f.k0);
       assert.equal(results[1].toString().slice(2), f.k1);
       assert.equal(results[15].toString().slice(2), f.k15);
     });
    });

    it('complies with rfc6979 test vector for p256/sha256', function() {
      function bnHex(bn) {
        return bn.toString().toUpperCase().slice(2);
      }

      const curve = sjcl.ecc.curves.p256;
      const q = 'FFFFFFFF00000000FFFFFFFFFFFFFFFFBCE6FAADA7179E84F3B9CAC2FC632551';
      const x = 'C9AFA9D845BA75166B5C215767B1D6934E50C3DB36E89B127B8A622B120F6721';
      const Ux = '60FED4BA255A9D31C961EB74C6356D68C049B8923B61FA6CE669622E60F29FB6';
      const Uy = '7903FE1008B8BC99A41AE9E95628BC64F2F1B20C2D7E9F5177A3C294D4462299';

      assert.equal(bnHex(curve.r), q);
      const d = new sjcl.bn(x);
      const pub = curve.G.mult(d);

      assert.equal(bnHex(pub.x), Ux);
      assert.equal(bnHex(pub.y), Uy);

      const secret = new sjcl.ecc.ecdsa.secretKey(curve, d);
      const h1 = sjcl.hash.sha256.hash('sample');
      const k = secret.generateDeterministicK(h1, function() {
        return true;
      });

      const expectedK =
        'A6E3C57DD01ABE90086538398355DD4C3B17AA873382B0F24D6129493D8AAD60';
      assert.equal(bnHex(k), expectedK);

      const rs = secret.sign(h1, undefined, undefined, new sjcl.bn(expectedK));
      const rsHex = sjcl.codec.hex.fromBits(rs).toUpperCase();
      assert.equal(
           rsHex.slice(0, 64),
          'EFD48B2AACB6A8FD1140DD9CD45E81D69D2C877B56AAF991C34D0EA84EAF3716');
      assert.equal(
           rsHex.slice(64),
          'F7CB1C942D657C41D436C7A1B6E29F65F3E900DBB9AFF4064DC4AB2F843ACDA8');

    });
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
        assert(pair.verify(message, sig));
        assert.equal(utils.arrayToHex(sig), expected[i]);
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
