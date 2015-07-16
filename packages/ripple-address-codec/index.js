var hashjs = require('hash.js');
var apiFactory = require('x-address-codec');

var NODE_PUBLIC = 28;
var NODE_PRIVATE = 32;
var ACCOUNT_ID = 0;
var FAMILY_SEED = 33;
var ED25519_SEED = [0x01, 0xE1, 0x4B];

var VERSIONS = {
  EdSeed : {
    expectedLength: 16,
    version: ED25519_SEED
  },
  AccountID: {version: ACCOUNT_ID },
  NodePublic: {version: NODE_PUBLIC },
  NodePrivate: {version: NODE_PRIVATE },
  K256Seed : {version: FAMILY_SEED }
};

function sha256(bytes) {
  return hashjs.sha256().update(bytes).digest();
}

var api = apiFactory({sha256: sha256, defaultAlphabet: 'ripple'});

function addVersion(name, args) {
  function add(operation) {
    api[operation + name] = function(string) {
      return api[operation](string, args);
    }
  }
  add('encode');
  add('decode');
}

api.decodeSeed = function(seed) {
  var args = {versions: [ED25519_SEED, FAMILY_SEED], expectedLength: 16};
  var decoded = api.decode(seed, args);
  decoded.type = decoded.versionIx === 0 ? 'EdSeed' : 'K256Seed';
  return decoded;
};

for (var k in VERSIONS) {
  addVersion(k, VERSIONS[k]);
}

module.exports = api;