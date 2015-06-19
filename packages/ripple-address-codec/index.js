var hashjs = require('hash.js');
var apiFactory = require('coin-address-codec');

var VER_NODE_PUBLIC = 28;
var VER_NODE_PRIVATE = 32;
var VER_ACCOUNT_ID = 0;
var VER_FAMILY_SEED = 33;

function sha256(bytes) {
  return hashjs.sha256().update(bytes).digest();
}

var api = apiFactory({sha256: sha256, defaultAlphabet: 'ripple'});

function addVersion(name, version) {
  function add(operation, func) {
    api[operation + name] = function(string) {
      return api[operation](string, {version: version});
    }
  }
  add('decode');
  add('encode');
}

addVersion('Seed', VER_FAMILY_SEED);
addVersion('AccountID', VER_ACCOUNT_ID);
addVersion('NodePublic', VER_NODE_PUBLIC);
addVersion('NodePrivate', VER_NODE_PRIVATE);

module.exports = api;