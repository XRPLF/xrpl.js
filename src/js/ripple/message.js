var async              = require('async');
var crypto             = require('crypto');
var sjcl               = require('./utils').sjcl;
var Remote             = require('./remote').Remote;
var Seed               = require('./seed').Seed;
var KeyPair            = require('./keypair').KeyPair;
var Account            = require('./account').Account;
var UInt160            = require('./uint160').UInt160;

// Message class (static)
var Message = {};

Message.HASH_FUNCTION  = sjcl.hash.sha512.hash;
Message.MAGIC_BYTES    = 'Ripple Signed Message:\n';

var REGEX_HEX = /^[0-9a-fA-F]+$/;
var REGEX_BASE64 = /^([A-Za-z0-9\+]{4})*([A-Za-z0-9\+]{2}==)|([A-Za-z0-9\+]{3}=)?$/;

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
 *  @param {String} message
 *  @param {sjcl.ecc.ecdsa.secretKey|Any format accepted by Seed.from_json} secret_key
 *  @param {RippleAddress} [The first key] account Field to specify the signing account. 
 *    If this is omitted the first account produced by the secret generator will be used.
 *  @returns {Base64-encoded String} signature
 */
Message.signMessage = function(message, secret_key, account) {

  return Message.signHash(Message.HASH_FUNCTION(Message.MAGIC_BYTES + message), secret_key, account);

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
 *  @param {bitArray|Hex-encoded String} hash
 *  @param {sjcl.ecc.ecdsa.secretKey|Any format accepted by Seed.from_json} secret_key
 *  @param {RippleAddress} [The first key] account Field to specify the signing account. 
 *    If this is omitted the first account produced by the secret generator will be used.
 *  @returns {Base64-encoded String} signature
 */
Message.signHash = function(hash, secret_key, account) {

  if (typeof hash === 'string' && /^[0-9a-fA-F]+$/.test(hash)) {
    hash = sjcl.codec.hex.toBits(hash);
  }

  if (typeof hash !== 'object' || hash.length <= 0 || typeof hash[0] !== 'number') {
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
 *  Verify the signature on a given message.
 *
 *  Note that this function is asynchronous. 
 *  The ripple-lib remote is used to check that the public
 *  key extracted from the signature corresponds to one that is currently
 *  active for the given account.
 *
 *  @static
 *
 *  @param {String} data.message
 *  @param {RippleAddress} data.account
 *  @param {Base64-encoded String} data.signature
 *  @param {ripple-lib Remote} remote
 *  @param {Function} callback
 *
 *  @callback callback
 *  @param {Error} error
 *  @param {boolean} is_valid true if the signature is valid, false otherwise
 */
Message.verifyMessageSignature = function(data, remote, callback) {

  if (typeof data.message === 'string') {
    data.hash = Message.HASH_FUNCTION(Message.MAGIC_BYTES + data.message);
  } else {
    return callback(new Error('Data object must contain message field to verify signature'));
  }

  return Message.verifyHashSignature(data, remote, callback);

};


/**
 *  Verify the signature on a given hash.
 *
 *  Note that this function is asynchronous. 
 *  The ripple-lib remote is used to check that the public
 *  key extracted from the signature corresponds to one that is currently
 *  active for the given account.
 *
 *  @static
 *
 *  @param {bitArray|Hex-encoded String} data.hash
 *  @param {RippleAddress} data.account
 *  @param {Base64-encoded String} data.signature
 *  @param {ripple-lib Remote} remote
 *  @param {Function} callback
 *
 *  @callback callback
 *  @param {Error} error
 *  @param {boolean} is_valid true if the signature is valid, false otherwise
 */
Message.verifyHashSignature = function(data, remote, callback) {

  var hash,
    account,
    signature;

  if(typeof callback !== 'function') {
    throw new Error('Must supply callback function');
  }

  hash = data.hash;
  if (hash && typeof hash === 'string' && REGEX_HEX.test(hash)) {
    hash = sjcl.codec.hex.toBits(hash);
  }

  if (typeof hash !== 'object' || hash.length <= 0 || typeof hash[0] !== 'number') {
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
    return callback(new Error('Must supply connected Remote to verify signature'));
  }

  function recoverPublicKey (async_callback) {

    var public_key;
    try {
      public_key = sjcl.ecc.ecdsa.publicKey.recoverFromSignature(hash, signature);
    } catch (err) {
      return async_callback(err);
    }

    if (public_key) {
      async_callback(null, public_key);
    } else {
      async_callback(new Error('Could not recover public key from signature'));
    }

  };

  function checkPublicKeyIsValid (public_key, async_callback) {

    // Get hex-encoded public key
    var key_pair = new KeyPair();
    key_pair._pubkey = public_key;
    var public_key_hex = key_pair.to_hex_pub();

    var account_class_instance = new Account(remote, account);
    account_class_instance.publicKeyIsActive(public_key_hex, async_callback);

  };

  var steps = [
    recoverPublicKey,
    checkPublicKeyIsValid
  ];

  async.waterfall(steps, callback);

};

exports.Message = Message;
