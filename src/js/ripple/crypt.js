var sjcl        = require('./utils').sjcl;
var base        = require('./base').Base;
var UInt160     = require('./uint160').UInt160;
var message     = require('./message');
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

Crypt.RippleAddress = (function() {
  
  function append_int(a, i) {
    return [].concat(a, i >> 24, (i >> 16) & 0xff, (i >> 8) & 0xff, i & 0xff);
  }

  function firstHalfOfSHA512(bytes) {
    return sjcl.bitArray.bitSlice(
      sjcl.hash.sha512.hash(sjcl.codec.bytes.toBits(bytes)),
      0, 256
    );
  };

  function SHA256_RIPEMD160(bits) {
    return sjcl.hash.ripemd160.hash(sjcl.hash.sha256.hash(bits));
  };

  return function(seed) {
    this.seed = base.decode_check(33, seed);

    if (!this.seed) {
      throw new Error('Invalid seed.');
    }

    this.getAddress = function(seq) {
      seq = seq || 0;

      var private_gen, public_gen, i = 0;

      do {
        private_gen = sjcl.bn.fromBits(firstHalfOfSHA512(append_int(this.seed, i)));
        i++;
      } while (!sjcl.ecc.curves.c256.r.greaterEquals(private_gen));

      public_gen = sjcl.ecc.curves.c256.G.mult(private_gen);

      var sec;
      i = 0;

      do {
        sec = sjcl.bn.fromBits(firstHalfOfSHA512(append_int(append_int(public_gen.toBytesCompressed(), seq), i)));
        i++;
      } while (!sjcl.ecc.curves.c256.r.greaterEquals(sec));

      var pubKey = sjcl.ecc.curves.c256.G.mult(sec).toJac().add(public_gen).toAffine();

      return base.encode_check(0, sjcl.codec.bytes.fromBits(SHA256_RIPEMD160(sjcl.codec.bytes.toBits(pubKey.toBytesCompressed()))));
    };
  };
})();

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
 * Validate a ripple address
 *
 * @param {integer} nWords - number of words
 */

Crypt.createSecret = function (nWords) {
  return sjcl.codec.hex.fromBits(sjcl.random.randomWords(nWords));
};

/**
 * Create a new master key
 */

Crypt.createMaster = function () {
  return base.encode_check(33, sjcl.codec.bytes.fromBits(sjcl.random.randomWords(4)));
};


/**
 * Create a ripple address from a master key
 *
 * @param {string} masterkey
 */

Crypt.getAddress = function (masterkey) {
  return new Crypt.RippleAddress(masterkey).getAddress();
};

/**
 * Hash data
 *
 * @param {string} data
 */

Crypt.hashSha512 = function (data) {
  return sjcl.codec.hex.fromBits(sjcl.hash.sha512.hash(data)); 
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
  var seed = ripple.Seed.from_json(secret).to_bits();
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
 * Create a string from request parameters that
 * will be used to sign a request
 *
 * @param {Object} config - request params
 * @param {Object} parsed - parsed url
 * @param {Object} date 
 * @param {Object} mechanism - type of signing
 */

Crypt.getStringToSign = function(config, parsed, date, mechanism) {
  // XXX This method doesn't handle signing GET requests correctly. The data
  //     field will be merged into the search string, not the request body.
  // Sort the properties of the JSON object into canonical form
  var canonicalData = JSON.stringify(copyObjectWithSortedKeys(config.data));

  // We're using URL parsing using browser functionality. Unfortunately the
  // parsing result slightly differs in IE - it is missing a leading slash.
  // XXX Proper fix would be to use a pure JS URL parser.
  var pathname = parsed.pathname;
 
  // IE11 Workaround
  if (pathname[0] !== '/') pathname = '/' + pathname;
 
  // Canonical request using Amazon's v4 signature format
  // See: http://docs.aws.amazon.com/general/latest/gr/sigv4-create-canonical-request.html
  var canonicalRequest = [
    config.method || 'GET',
    pathname || '',
    parsed.search || '',
    // XXX Headers signing not supported
    '',
    '',
    Crypt.hashSha512(canonicalData).toLowerCase()
  ].join('\n');

  // String to sign inspired by Amazon's v4 signature format
  // See: http://docs.aws.amazon.com/general/latest/gr/sigv4-create-string-to-sign.html
  //
  // We don't have a credential scope, so we skip it.
  //
  // But that modifies the format, so the format ID is RIPPLE1, instead of AWS4.
  return [
    mechanism,
    date,
    Crypt.hashSha512(canonicalRequest).toLowerCase()
  ].join('\n');
};

/**
 * HMAC signed request
 *
 * @param {Object} config
 * @param {Object} auth_secret
 * @param {Object} blob_id
 */

Crypt.signRequestHmac = function(config, auth_secret, blob_id) {
  config = extend(true, {}, config);

  // Parse URL
  var parsed        = parser.parse(config.url);
  var date          = dateAsIso8601();
  var signatureType = 'RIPPLE1-HMAC-SHA512';
  var stringToSign  = Crypt.getStringToSign(config, parsed, date, signatureType);
  var signature     = Crypt.signString(auth_secret, stringToSign);

  var query = querystring.stringify({
    signature: Crypt.base64ToBase64Url(signature),
    signature_date: date,
    signature_blob_id: blob_id,
    signature_type: signatureType
  });

  config.url += (parsed.search ? '&' : '?') + query;
  return config;
};

/**
 * Asymmetric signed request
 *
 * @param {Object} config
 * @param {Object} secretKey
 * @param {Object} account
 * @param {Object} blob_id
 */

Crypt.signRequestAsymmetric = function(config, secretKey, account, blob_id) {
  config = extend(true, {}, config);

  // Parse URL
  var parsed        = parser.parse(config.url);
  var date          = dateAsIso8601();
  var signatureType = 'RIPPLE1-ECDSA-SHA512';
  var stringToSign  = Crypt.getStringToSign(config, parsed, date, signatureType);
  var signature     = message.signMessage(stringToSign, secretKey);

  var query = querystring.stringify({
    signature: Crypt.base64ToBase64Url(signature),
    signature_date: date,
    signature_blob_id: blob_id,
    signature_account: account,
    signature_type: signatureType
  })

  config.url += (parsed.search ? '&' : '?') + query;

  return config;
};

//prepare for signing
function copyObjectWithSortedKeys(object) {
  if (isPlainObject(object)) {
    var newObj = {};
    var keysSorted = Object.keys(object).sort();
    var key;

    for (var i in keysSorted) {
      key = keysSorted[i];
      if (Object.prototype.hasOwnProperty.call(object, key)) {
        newObj[key] = copyObjectWithSortedKeys(object[key]);
      }
    }

    return newObj;
  } else if (Array.isArray(object)) {
    return object.map(copyObjectWithSortedKeys);
  } else {
    return object;
  }
};

//from npm extend
function isPlainObject(obj) {
  var hasOwn = Object.prototype.hasOwnProperty;
  var toString = Object.prototype.toString;

  if (!obj || toString.call(obj) !== '[object Object]' || obj.nodeType || obj.setInterval) {
    return false;
  }

  var has_own_constructor = hasOwn.call(obj, 'constructor');
  var has_is_property_of_method = hasOwn.call(obj.constructor.prototype, 'isPrototypeOf');

  // Not own constructor property must be Object
  if (obj.constructor && !has_own_constructor && !has_is_property_of_method) {
    return false;
  }

  // Own properties are enumerated firstly, so to speed up,
  // if last one is own, then all properties are own.
  var key;

  for ( key in obj ) {}

  return key === void(0) || hasOwn.call( obj, key );
}

var dateAsIso8601 = (function() {
  function pad(n) {
    return (n < 0 || n > 9 ? '' : '0') + n;
  };

  return function dateAsIso8601() {
    var date = new Date();
    return date.getUTCFullYear() + "-" +
      pad(date.getUTCMonth() + 1) + "-" +
      pad(date.getUTCDate()) + "T" +
      pad(date.getUTCHours()) + ":" +
      pad(date.getUTCMinutes()) + ":" +
      pad(date.getUTCSeconds()) + ".000Z";
  };
})();

exports.Crypt = Crypt;

