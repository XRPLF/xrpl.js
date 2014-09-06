exports.Remote           = require('./remote').Remote;
exports.Request          = require('./request').Request;
exports.Amount           = require('./amount').Amount;
exports.Account          = require('./account').Account;
exports.Transaction      = require('./transaction').Transaction;
exports.Currency         = require('./currency').Currency;
exports.Base             = require('./base').Base;
exports.UInt160          = require('./uint160').UInt160;
exports.UInt256          = require('./uint256').UInt256;
exports.Seed             = require('./seed').Seed;
exports.Meta             = require('./meta').Meta;
exports.SerializedObject = require('./serializedobject').SerializedObject;
exports.RippleError      = require('./rippleerror').RippleError;
exports.Message          = require('./message').Message;
exports.VaultClient      = require('./vaultclient').VaultClient;
exports.AuthInfo         = require('./authinfo').AuthInfo;
exports.RippleTxt        = require('./rippletxt').RippleTxt;
exports.binformat        = require('./binformat');
exports.utils            = require('./utils');
exports.Server           = require('./server').Server;
exports.Wallet           = require('./wallet');

// Important: We do not guarantee any specific version of SJCL or for any
// specific features to be included. The version and configuration may change at
// any time without warning.
//
// However, for programs that are tied to a specific version of ripple.js like
// the official client, it makes sense to expose the SJCL instance so we don't
// have to include it twice.
exports.sjcl   = require('./utils').sjcl;

exports.config = require('./config');

// camelCase to under_scored API conversion
function attachUnderscored(c) {
  var o = exports[c];

  Object.keys(o.prototype).forEach(function(key) {
    var UPPERCASE = /([A-Z]{1})[a-z]+/g;

    if (!UPPERCASE.test(key)) {
      return;
    }

    var underscored = key.replace(UPPERCASE, function(c) {
      return '_' + c.toLowerCase();
    });

    o.prototype[underscored] = o.prototype[key];
  });
};

[ 'Remote',
  'Request',
  'Transaction',
  'Account',
  'Server'
].forEach(attachUnderscored);

// vim:sw=2:sts=2:ts=8:et
