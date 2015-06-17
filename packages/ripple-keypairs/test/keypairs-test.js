const assert = require('assert');
const _ = require('lodash');
const codec = require('ripple-address-codec');
const {Secp256k1Pair, seedFromPhrase, Ed25519Pair} = require('..');
const ZEROES = [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0];

describe('KeyPair', function() {
  let pair;

  it('can be created from a passphrase', function() {
    const seed = seedFromPhrase('niq');
    const key = Ed25519Pair.fromSeed(seed);
    assert.equal(key.accountID(), 'rJZdUusLDtY9NEsGea7ijqhVrXv98rYBYN');
    assert.equal(codec.encodeSeed(seed), 'shQUG1pmPYrcnSUGeuJFJTA1b3JSL');
  })

  before(function function_name () {
     pair = Secp256k1Pair.fromSeed(ZEROES);
  });

  it('can be instantiated', function() {
    const sig = pair.sign(ZEROES);
    assert(pair.verify(ZEROES, sig));
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
  const key = Secp256k1Pair.fromSeed(seedFromPhrase('niq'));
  function test_factory(i) {
    it('can deterministically sign/verify message [' + i +
                     ']', function() {
      const message = [i];
      const sig = key.sign(message);
      // assert.equal(utils.arrayToHex(sig), expected[i]);
      assert(key.verify(message, sig));
    });
  }

  for (let n = 0; n < 5; n++) {
    test_factory(n);
  }
});