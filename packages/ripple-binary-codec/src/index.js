'use strict';

const assert = require('assert');
const coreTypes = require('@niq/ripple-core-types');
const {binary: {bytesToHex,
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
