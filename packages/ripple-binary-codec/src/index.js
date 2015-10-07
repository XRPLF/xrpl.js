'use strict';

const assert = require('assert');
const coreTypes = require('@niq/ripple-core');
const {quality,
       binary: {bytesToHex,
                signingData,
                multiSigningData,
                binaryToJSON,
                serializeObject}} = coreTypes;

exports.decode = function(binary) {
  assert(typeof binary === 'string', 'binary must be a hex string');
  return binaryToJSON(binary);
};

exports.encode = function(json) {
  assert(typeof json === 'object');
  return bytesToHex(serializeObject(json));
};

exports.encodeForSigning = function(json) {
  assert(typeof json === 'object');
  return bytesToHex(signingData(json));
};

exports.encodeForMultisigning = function(json, signer) {
  assert(typeof json === 'object');
  return bytesToHex(multiSigningData(json, signer));
};

exports.encodeQuality = function(value) {
  assert(typeof value === 'string');
  return bytesToHex(quality.encode(value));
};

exports.decodeQuality = function(value) {
  assert(typeof value === 'string');
  return quality.decode(value).toString();
};
