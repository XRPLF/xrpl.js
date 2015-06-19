const assert = require('assert');
const _ = require('lodash');
const utils = require('../src/utils');
const codec = require('ripple-address-codec');
const {Secp256k1Pair, seedFromPhrase, Ed25519Pair} = require('../src');
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
    '30440220312B2E0894B81A2E070ACE566C5DFC70CDD18E67D44E2CFEF2EB5495F7DE2DAC02205E155C0019502948C265209DFDD7D84C4A05BD2C38CEE6ECD7C33E9C9B12BEC2',
    '304402202A5860A12C15EBB8E91AA83F8E19D85D4AC05B272FC0C4083519339A7A76F2B802200852F9889E1284CF407DC7F73D646E62044C5AB432EAEF3FFF3F6F8EE9A0F24C',
    '3045022100B1658C88D1860D9F8BEB25B79B3E5137BBC2C382D08FE7A068FFC6AB8978C8040220644F64B97EA144EE7D5CCB71C2372DD730FA0A659E4C18241A80D6C915350263',
    '3045022100F3E541330FF79FFC42EB0491EDE1E47106D94ECFE3CDB2D9DD3BC0E8861F6D45022013F62942DD626D6C9731E317F372EC5C1F72885C4727FDBEE9D9321BC530D7B2',
    '3045022100998ABE378F4119D8BEE9843482C09F0D5CE5C6012921548182454C610C57A269022036BD8EB71235C4B2C67339DE6A59746B1F7E5975987B7AB99B313D124A69BB9F'
  ];
  const key = Secp256k1Pair.fromSeed(seedFromPhrase('niq'));
  function test_factory(i) {
    it('can deterministically sign/verify message [' + i +
                     ']', function() {
      const message = [i];
      const sig = key.sign(message);
      assert.equal(utils.arrayToHex(sig), expected[i]);
      assert(key.verify(message, sig));
    });
  }

  for (let n = 0; n < 5; n++) {
    test_factory(n);
  }
});