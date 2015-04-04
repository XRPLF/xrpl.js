'use strict';

var async = require('async');
var sjcl = require('./utils').sjcl;
var Remote = require('./remote').Remote;
var Seed = require('./seed').Seed;
var KeyPair = require('./keypair').KeyPair;
var Account = require('./account').Account;
var UInt160 = require('./uint160').UInt160;

// Message class (static)
var Message = {};

Message.HASH_FUNCTION = sjcl.hash.sha512.hash;
Message.MAGIC_BYTES = 'Ripple Signed Message:\n';

var REGEX_HEX = /^[0-9a-fA-F]+$/;
var REGEX_BASE64 =
      /^([A-Za-z0-9\+]{4})*([A-Za-z0-9\+]{2}==)|([A-Za-z0-9\+]{3}=)?$/;

/**
* Bytes encoded into a hex String
* @typedef {String} HexString
*/

/**
* Bytes encoded into a Base64 String
* @typedef {String} Base64String
*/

/**
* A secret key, or a seed-b58/seed-hex/passphrase String to generate one.
* @typedef {sjcl.ecc.ecdsa.secretKey|String} SecretKey
*/

/**
 *  Produce a Base64-encoded signature on the given message with
 *  the string 'Ripple Signed Message:\n' prepended.
 *
 *  Note that this signature uses the signing function that includes
 *  a recovery_factor to be able to extract the public key from the signature
 *  without having to pass the public key along with the signature.
 *
 *  @static
 *
 *  @param {String} message - to sign
 *  @param {SecretKey} secret_key - used to sign message
 *  @param {RippleAddress} [account] - derive key pair from seed to match
 *  @returns {Base64String} - Base64 encoded signature
 */
Message.signMessage = function(message, secret_key, account) {

  var hashFunction = Message.HASH_FUNCTION;
  var hash = hashFunction(Message.MAGIC_BYTES + message);
  return Message.signHash(hash, secret_key, account);

};

/**
 *  Produce a Base64-encoded signature on the given hex-encoded hash.
 *
 *  Note that this signature uses the signing function that includes
 *  a recovery_factor to be able to extract the public key from the signature
 *  without having to pass the public key along with the signature.
 *
 *  @static
 *
 *  @param {bitArray|HexString} hash - to sign
 *  @param {SecretKey} secret_key - used to sign message
 *  @param {RippleAddress} [account] - derive key pair from seed to match
 *
 *  @returns {Base64String} - Base64 encoded signature
 */
Message.signHash = function(hash, secret_key, account) {

  if (typeof hash === 'string' && /^[0-9a-fA-F]+$/.test(hash)) {
    hash = sjcl.codec.hex.toBits(hash);
  }

  if (typeof hash !== 'object' || hash.length <= 0 ||
                                 typeof hash[0] !== 'number') {
    throw new Error('Hash must be a bitArray or hex-encoded string');
  }

  if (!(secret_key instanceof sjcl.ecc.ecdsa.secretKey)) {
    secret_key = Seed.from_json(secret_key).get_key(account)._secret;
  }

  var signature_bits = secret_key.signWithRecoverablePublicKey(hash);
  var signature_base64 = sjcl.codec.base64.fromBits(signature_bits);

  return signature_base64;

};

/**
 *  @callback verifyCallback
 *  @param {Error} error -
 *  @param {boolean} is_valid - true if the signature is valid, false otherwise
 */

/**
 *  Verify the signature on a given message.
 *
 *  Note that this function is asynchronous.
 *  The ripple-lib remote is used to check that the public
 *  key extracted from the signature corresponds to one that is currently
 *  active for the given account.
 *
 *  @param {Object} data - data bundle
 *  @param {String} data.message - to verify
 *  @param {RippleAddress} data.account - which created signature
 *  @param {Base64String} data.signature - of message
 *
 *  @param {ripple-lib.Remote} remote - to retrieve account_info
 *  @param {verifyCallback} callback - to call back
 *
 *  @return {void}
 *  @static
 */
Message.verifyMessageSignature = function(data, remote, callback) {

  if (typeof data.message === 'string') {
    var hashFunction = Message.HASH_FUNCTION;
    data.hash = hashFunction(Message.MAGIC_BYTES + data.message);
  } else {
    return callback(
      new Error('Data object must contain message field to verify signature'));
  }

  return Message.verifyHashSignature(data, remote, callback);

};


/**
 *  @callback verifyCallback
 *  @param {Error} error -
 *  @param {boolean} is_valid - true if the signature is valid, false otherwise
 */

/**
 *  Verify the signature on a given hash.
 *
 *  Note that this function is asynchronous.
 *  The ripple-lib remote is used to check that the public
 *  key extracted from the signature corresponds to one that is currently
 *  active for the given account.
 *
 *
 *  @param {Object} data - data bundle
 *  @param {String} data.message - to verify
 *  @param {RippleAddress} data.account - which created signature
 *  @param {Base64String} data.signature - of message
 *
 *  @param {ripple-lib.Remote} remote - to retrieve account_info
 *  @param {verifyCallback} callback - to call back
 *
 *  @return {void}
 *  @static
 *
 */
Message.verifyHashSignature = function(data, remote, callback) {

  var hash,
    account,
    signature;

  if (typeof callback !== 'function') {
    throw new Error('Must supply callback function');
  }

  hash = data.hash;
  if (hash && typeof hash === 'string' && REGEX_HEX.test(hash)) {
    hash = sjcl.codec.hex.toBits(hash);
  }

  if (typeof hash !== 'object' || typeof hash[0] !== 'number' ||
      hash.length <= 0) {
    return callback(new Error('Hash must be a bitArray or hex-encoded string'));
  }

  account = data.account || data.address;
  if (!account || !UInt160.from_json(account).is_valid()) {
    return callback(new Error('Account must be a valid ripple address'));
  }

  signature = data.signature;
  if (typeof signature !== 'string' || !REGEX_BASE64.test(signature)) {
    return callback(new Error('Signature must be a Base64-encoded string'));
  }
  signature = sjcl.codec.base64.toBits(signature);

  if (!(remote instanceof Remote) || remote.state !== 'online') {
    return callback(
        new Error('Must supply connected Remote to verify signature'));
  }

  function recoverPublicKey(async_callback) {

    var public_key;
    try {
      public_key = sjcl.ecc.ecdsa.publicKey
                       .recoverFromSignature(hash, signature);
    } catch (err) {
      return async_callback(err);
    }

    if (public_key) {
      async_callback(null, public_key);
    } else {
      async_callback(new Error('Could not recover public key from signature'));
    }

  }

  function checkPublicKeyIsValid(public_key, async_callback) {

    // Get hex-encoded public key
    var key_pair = new KeyPair();
    key_pair._pubkey = public_key;
    var public_key_hex = key_pair.to_hex_pub();

    var account_class_instance = new Account(remote, account);
    account_class_instance.publicKeyIsActive(public_key_hex, async_callback);

  }

  var steps = [
    recoverPublicKey,
    checkPublicKeyIsValid
  ];

  async.waterfall(steps, callback);

};

exports.Message = Message;
