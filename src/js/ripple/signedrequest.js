var Crypt = require('./crypt').Crypt;
var Message = require('./message').Message;
var parser  = require("url");
var querystring = require('querystring');
var extend = require("extend");

var SignedRequest = function (config) {
  // XXX Constructor should be generalized and constructing from an Angular.js
  //     $http config should be a SignedRequest.from... utility method.
  this.config = extend(true, {}, config);
  if (!this.config.data) this.config.data = {};
};



/**
 * Create a string from request parameters that
 * will be used to sign a request
 * @param {Object} parsed - parsed url
 * @param {Object} date 
 * @param {Object} mechanism - type of signing
 */
SignedRequest.prototype.getStringToSign = function (parsed, date, mechanism) {
  // XXX This method doesn't handle signing GET requests correctly. The data
  //     field will be merged into the search string, not the request body.

  // Sort the properties of the JSON object into canonical form
  var canonicalData = JSON.stringify(copyObjectWithSortedKeys(this.config.data));

  // Canonical request using Amazon's v4 signature format
  // See: http://docs.aws.amazon.com/general/latest/gr/sigv4-create-canonical-request.html
  var canonicalRequest = [
    this.config.method || 'GET',
    parsed.pathname || '',
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
}

//from npm extend
function isPlainObject(obj) {
  var hasOwn = Object.prototype.hasOwnProperty;
  var toString = Object.prototype.toString;

  if (!obj || toString.call(obj) !== '[object Object]' || obj.nodeType || obj.setInterval)
    return false;

  var has_own_constructor = hasOwn.call(obj, 'constructor');
  var has_is_property_of_method = hasOwn.call(obj.constructor.prototype, 'isPrototypeOf');
  // Not own constructor property must be Object
  if (obj.constructor && !has_own_constructor && !has_is_property_of_method)
    return false;

  // Own properties are enumerated firstly, so to speed up,
  // if last one is own, then all properties are own.
  var key;
  for ( key in obj ) {}

  return key === undefined || hasOwn.call( obj, key );
};

/**
 * HMAC signed request
 * @param {Object} config
 * @param {Object} auth_secret
 * @param {Object} blob_id
 */
SignedRequest.prototype.signHmac = function (auth_secret, blob_id) {
  var config = extend(true, {}, this.config);

  // Parse URL
  var parsed        = parser.parse(config.url);
  var date          = dateAsIso8601();
  var signatureType = 'RIPPLE1-HMAC-SHA512';
  var stringToSign  = this.getStringToSign(parsed, date, signatureType);
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
 * @param {Object} config
 * @param {Object} secretKey
 * @param {Object} account
 * @param {Object} blob_id
 */
SignedRequest.prototype.signAsymmetric = function (secretKey, account, blob_id) {
  var config = extend(true, {}, this.config);

  // Parse URL
  var parsed        = parser.parse(config.url);
  var date          = dateAsIso8601();
  var signatureType = 'RIPPLE1-ECDSA-SHA512';
  var stringToSign  = this.getStringToSign(parsed, date, signatureType);
  var signature     = Message.signMessage(stringToSign, secretKey);
 
  var query = querystring.stringify({
    signature: Crypt.base64ToBase64Url(signature),
    signature_date: date,
    signature_blob_id: blob_id,
    signature_account: account,
    signature_type: signatureType
  });

  config.url += (parsed.search ? '&' : '?') + query;

  return config;
};

/**
 * Asymmetric signed request for vault recovery
 * @param {Object} config
 * @param {Object} secretKey
 * @param {Object} username
 */
SignedRequest.prototype.signAsymmetricRecovery = function (secretKey, username) {
  var config = extend(true, {}, this.config);

  // Parse URL
  var parsed        = parser.parse(config.url);
  var date          = dateAsIso8601();
  var signatureType = 'RIPPLE1-ECDSA-SHA512';
  var stringToSign  = this.getStringToSign(parsed, date, signatureType);
  var signature     = Message.signMessage(stringToSign, secretKey);
 
  var query = querystring.stringify({
    signature: Crypt.base64ToBase64Url(signature),
    signature_date: date,
    signature_username: username,
    signature_type: signatureType
  });

  config.url += (parsed.search ? '&' : '?') + query;

  return config;
};

var dateAsIso8601 = (function () {
  function pad(n) {
    return (n < 0 || n > 9 ? "" : "0") + n;
  }

  return function dateAsIso8601() {
    var date = new Date();
    return date.getUTCFullYear() + "-" +
      pad(date.getUTCMonth()     + 1)  + "-" +
      pad(date.getUTCDate())     + "T" +
      pad(date.getUTCHours())    + ":" +
      pad(date.getUTCMinutes())  + ":" +
      pad(date.getUTCSeconds())  + ".000Z";
  };
})();

// XXX Add methods for verifying requests
// SignedRequest.prototype.verifySignatureHmac
// SignedRequest.prototype.verifySignatureAsymetric

exports.SignedRequest = SignedRequest;

