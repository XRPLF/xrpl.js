exports.Remote           = require('./remote').Remote;
exports.Request          = require('./request').Request;
exports.Amount           = require('./amount').Amount;
exports.Currency         = require('./currency').Currency;
exports.Base             = require('./base').Base;
exports.UInt160          = require('./amount').UInt160;
exports.Seed             = require('./amount').Seed;
exports.Transaction      = require('./transaction').Transaction;
exports.Meta             = require('./meta').Meta;
exports.SerializedObject = require('./serializedobject').SerializedObject;
exports.RippleError      = require('./rippleerror').RippleError;

exports.binformat        = require('./binformat');
exports.utils            = require('./utils');
exports.Server           = require('./server').Server;

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
function attachUnderscored(o) {
  Object.keys(o.prototype).forEach(function(key) {
    var UPPERCASE = /([A-Z]{1})[a-z]+/g;

    if (!UPPERCASE.test(key)) return;

    var underscored = key.replace(UPPERCASE, function(c) {
      return '_' + c.toLowerCase();
    });

    o.prototype[underscored] = o.prototype[key];
  });
};

[ exports.Remote,
  exports.Request,
  exports.Transaction
].forEach(attachUnderscored);

// vim:sw=2:sts=2:ts=8:et
