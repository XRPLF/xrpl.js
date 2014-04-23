var async   = require('async');
var UInt160 = require('./uint160').UInt160;
var sjcl    = require('./utils').sjcl;
var Base    = require('./base').Base;


/**
 * @constructor PubKeyValidator
 * @param {Remote} remote
 */

function PubKeyValidator(remote) {

  var self = this;

  if (remote) {
    self._remote = remote;
  } else {
    throw(new Error('Must instantiate the PubKeyValidator with a ripple-lib Remote'));
  }

  // Convert hex string to UInt160
  self._parsePublicKey = function(public_key) {

    // Based on functions in /src/js/ripple/keypair.js
    function hexToUInt160(public_key) {
      var bits = sjcl.codec.hex.toBits(public_key);
      var hash = sjcl.hash.ripemd160.hash(sjcl.hash.sha256.hash(bits));
      var address = UInt160.from_bits(hash);
      address.set_version(Base.VER_ACCOUNT_ID);
      return address.to_json();
    }

    if (UInt160.is_valid(public_key)) {
      return public_key;
    } else if (/^[0-9a-fA-F]+$/.test(public_key)) {
      return hexToUInt160(public_key);
    } else {
      throw(new Error('Public key is invalid. Must be a UInt160 or a hex string'));
    }
  };

}

/**
 * Check whether the public key is valid for the specified address.
 *
 * @param {String} address
 * @param {String} public_key
 * @param {Function} callback
 *
 * callback function is called with (err, is_valid), where is_valid
 * is a boolean indicating whether the public_key supplied is active
 */

PubKeyValidator.prototype.validate = function(address, public_key, callback) {

  var self = this;

  var public_key_as_uint160;
  try {
    public_key_as_uint160 = self._parsePublicKey(public_key);
  } catch (e) {
    return callback(e);
  }


  function getAccountInfo(async_callback) {
    self._remote.account(address).getInfo(async_callback);
  };

  function publicKeyIsValid(account_info_res, async_callback) {
    var account_info = account_info_res.account_data;

    // Respond with true if the RegularKey is set and matches the given public key or
    // if the public key matches the account address and the lsfDisableMaster is not set
    if (account_info.RegularKey &&
      account_info.RegularKey === public_key_as_uint160) {

      async_callback(null, true);

    } else if (account_info.Account === public_key_as_uint160 &&
      ((account_info.Flags & 0x00100000) === 0)) {

      async_callback(null, true);

    } else {

      async_callback(null, false);

    }

  };

  var steps = [
    getAccountInfo,
    publicKeyIsValid
  ];

  async.waterfall(steps, callback);

};

module.exports = PubKeyValidator;
