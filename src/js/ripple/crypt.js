var sjcl        = require('./utils').sjcl;
var base        = require('./base').Base;
var Seed        = require('./seed').Seed;
var UInt160     = require('./uint160').UInt160;
var UInt256     = require('./uint256').UInt256;
var request     = require('superagent');
var querystring = require('querystring');
var extend      = require("extend");
var parser      = require("url");
var Crypt       = { };

var cryptConfig = {
  cipher : 'aes',
  mode   : 'ccm',
  ts     : 64,   // tag length
  ks     : 256,  // key size
  iter   : 1000  // iterations (key derivation)
};

/**
 * Full domain hash based on SHA512
 */

function fdh(data, bytelen) {
  var bitlen = bytelen << 3;

  if (typeof data === 'string') {
    data = sjcl.codec.utf8String.toBits(data);
  }

  // Add hashing rounds until we exceed desired length in bits
  var counter = 0, output = [];

  while (sjcl.bitArray.bitLength(output) < bitlen) {
    var hash = sjcl.hash.sha512.hash(sjcl.bitArray.concat([counter], data));
    output = sjcl.bitArray.concat(output, hash);
    counter++;
  }

  // Truncate to desired length
  output = sjcl.bitArray.clamp(output, bitlen);

  return output;
};

/**
 * This is a function to derive different hashes from the same key. 
 * Each hash is derived as HMAC-SHA512HALF(key, token).
 *
 * @param {string} key
 * @param {string} hash
 */

function keyHash(key, token) {
  var hmac = new sjcl.misc.hmac(key, sjcl.hash.sha512);
  return sjcl.codec.hex.fromBits(sjcl.bitArray.bitSlice(hmac.encrypt(token), 0, 256));
};

/**
 * add entropy at each call to get random words
 * @param {number} nWords
 */
function randomWords (nWords) {
  for (var i = 0; i < 8; i++) {
    sjcl.random.addEntropy(Math.random(), 32, "Math.random()");
  }  
  
  return sjcl.random.randomWords(nWords);  
}

/****** exposed functions ******/

/**
 * KEY DERIVATION FUNCTION
 *
 * This service takes care of the key derivation, i.e. converting low-entropy
 * secret into higher entropy secret via either computationally expensive
 * processes or peer-assisted key derivation (PAKDF).
 *
 * @param {object}    opts
 * @param {string}    purpose - Key type/purpose
 * @param {string}    username
 * @param {string}    secret - Also known as passphrase/password
 * @param {function}  fn
 */

Crypt.derive = function(opts, purpose, username, secret, fn) {
  var tokens;

  if (purpose === 'login') {
    tokens = ['id', 'crypt'];
  } else {
    tokens = ['unlock'];
  }

  var iExponent = new sjcl.bn(String(opts.exponent));
  var iModulus  = new sjcl.bn(String(opts.modulus));
  var iAlpha    = new sjcl.bn(String(opts.alpha));

  var publicInfo = [ 'PAKDF_1_0_0', opts.host.length, opts.host, username.length, username, purpose.length, purpose ].join(':') + ':';
  var publicSize = Math.ceil(Math.min((7 + iModulus.bitLength()) >>> 3, 256) / 8);
  var publicHash = fdh(publicInfo, publicSize);
  var publicHex  = sjcl.codec.hex.fromBits(publicHash);
  var iPublic    = new sjcl.bn(String(publicHex)).setBitM(0);
  var secretInfo = [ publicInfo, secret.length, secret ].join(':') + ':';
  var secretSize = (7 + iModulus.bitLength()) >>> 3;
  var secretHash = fdh(secretInfo, secretSize);
  var secretHex  = sjcl.codec.hex.fromBits(secretHash);
  var iSecret    = new sjcl.bn(String(secretHex)).mod(iModulus);

  if (iSecret.jacobi(iModulus) !== 1) {
    iSecret = iSecret.mul(iAlpha).mod(iModulus);
  }

  var iRandom;

  for (;;) {
    iRandom = sjcl.bn.random(iModulus, 0);
    if (iRandom.jacobi(iModulus) === 1) {
      break;
    }
  }

  var iBlind   = iRandom.powermodMontgomery(iPublic.mul(iExponent), iModulus);
  var iSignreq = iSecret.mulmod(iBlind, iModulus);
  var signreq  = sjcl.codec.hex.fromBits(iSignreq.toBits());

  request.post(opts.url)
    .send({ info: publicInfo, signreq: signreq })
    .end(function(err, resp) {
      if (err || !resp) {
        return fn(new Error('Could not query PAKDF server ' + opts.host));
      }

      var data = resp.body || resp.text ? JSON.parse(resp.text) : {};

      if (data.result !== 'success') {
        return fn(new Error('Could not query PAKDF server '+opts.host));
      }

      var iSignres = new sjcl.bn(String(data.signres));
      var iRandomInv = iRandom.inverseMod(iModulus);
      var iSigned    = iSignres.mulmod(iRandomInv, iModulus);
      var key        = iSigned.toBits();
      var result     = { };

      tokens.forEach(function(token) {
        result[token] = keyHash(key, token);
      });

      fn(null, result);
    });
};

/**
 * Imported from ripple-client
 */



/**
 * Encrypt data
 *
 * @param {string} key
 * @param {string} data
 */

Crypt.encrypt = function(key, data) {
  key = sjcl.codec.hex.toBits(key);

  var opts = extend(true, {}, cryptConfig);

  var encryptedObj = JSON.parse(sjcl.encrypt(key, data, opts));
  var version = [sjcl.bitArray.partial(8, 0)];
  var initVector = sjcl.codec.base64.toBits(encryptedObj.iv);
  var ciphertext = sjcl.codec.base64.toBits(encryptedObj.ct);

  var encryptedBits = sjcl.bitArray.concat(version, initVector);
  encryptedBits = sjcl.bitArray.concat(encryptedBits, ciphertext);

  return sjcl.codec.base64.fromBits(encryptedBits);
};

/**
 * Decrypt data
 *
 * @param {string} key
 * @param {string} data
 */

Crypt.decrypt = function (key, data) {
  
  key = sjcl.codec.hex.toBits(key);
  var encryptedBits = sjcl.codec.base64.toBits(data);

  var version = sjcl.bitArray.extract(encryptedBits, 0, 8);

  if (version !== 0) {
    throw new Error('Unsupported encryption version: '+version);
  }

  var encrypted = extend(true, {}, cryptConfig, {
    iv: sjcl.codec.base64.fromBits(sjcl.bitArray.bitSlice(encryptedBits, 8, 8+128)),
    ct: sjcl.codec.base64.fromBits(sjcl.bitArray.bitSlice(encryptedBits, 8+128))
  });

  return sjcl.decrypt(key, JSON.stringify(encrypted));
};


/**
 * Validate a ripple address
 *
 * @param {string} address
 */

Crypt.isValidAddress = function (address) {
  return UInt160.is_valid(address);
};

/**
 * Create an encryption key
 *
 * @param {integer} nWords - number of words
 */

Crypt.createSecret = function (nWords) {
  return sjcl.codec.hex.fromBits(randomWords(nWords));
};

/**
 * Create a new master key
 */

Crypt.createMaster = function () {
  return base.encode_check(33, sjcl.codec.bytes.fromBits(randomWords(4)));
};


/**
 * Create a ripple address from a master key
 *
 * @param {string} masterkey
 */

Crypt.getAddress = function (masterkey) {
  return Seed.from_json(masterkey).get_key().get_address().to_json();
};

/**
 * Hash data using SHA-512.
 *
 * @param {string|bitArray} data
 * @return {string} Hash of the data
 */

Crypt.hashSha512 = function (data) {
  // XXX Should return a UInt512
  return sjcl.codec.hex.fromBits(sjcl.hash.sha512.hash(data)); 
};

/**
 * Hash data using SHA-512 and return the first 256 bits.
 *
 * @param {string|bitArray} data
 * @return {UInt256} Hash of the data
 */
Crypt.hashSha512Half = function (data) {
  return UInt256.from_hex(Crypt.hashSha512(data).substr(0, 64));
};


/**
 * Sign a data string with a secret key
 *
 * @param {string} secret
 * @param {string} data
 */

Crypt.signString = function(secret, data) {
  var hmac = new sjcl.misc.hmac(sjcl.codec.hex.toBits(secret), sjcl.hash.sha512);
  return sjcl.codec.hex.fromBits(hmac.mac(data));
};

/**
 * Create an an accout recovery key
 *
 * @param {string} secret
 */

Crypt.deriveRecoveryEncryptionKeyFromSecret = function(secret) {
  var seed = Seed.from_json(secret).to_bits();
  var hmac = new sjcl.misc.hmac(seed, sjcl.hash.sha512);
  var key  = hmac.mac('ripple/hmac/recovery_encryption_key/v1');
  key      = sjcl.bitArray.bitSlice(key, 0, 256);
  return sjcl.codec.hex.fromBits(key);
};

/**
 * Convert base64 encoded data into base64url encoded data.
 *
 * @param {String} base64 Data
 */

Crypt.base64ToBase64Url = function(encodedData) {
  return encodedData.replace(/\+/g, '-').replace(/\//g, '_').replace(/[=]+$/, '');
};

/**
 * Convert base64url encoded data into base64 encoded data.
 *
 * @param {String} base64 Data
 */

Crypt.base64UrlToBase64 = function(encodedData) {
  encodedData = encodedData.replace(/-/g, '+').replace(/_/g, '/');

  while (encodedData.length % 4) {
    encodedData += '=';
  }

  return encodedData;
};

/**
 * base64 to UTF8
 */

Crypt.decodeBase64 = function (data) {
  return sjcl.codec.utf8String.fromBits(sjcl.codec.base64.toBits(data));
}

exports.Crypt = Crypt;
