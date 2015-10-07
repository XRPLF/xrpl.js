'use strict';

const assert = require('assert');
const coreTypes = require('@niq/ripple-core');
const {quality,
       binary: {bytesToHex,
                signingData,
                multiSigningData,
                binaryToJSON,
                serializeObject}} = coreTypes;

function decode(binary) {
  assert(typeof binary === 'string', 'binary must be a hex string');
  return binaryToJSON(binary);
}

function encode(json) {
  assert(typeof json === 'object');
  return bytesToHex(serializeObject(json));
}

function encodeForSigning(json) {
  assert(typeof json === 'object');
  return bytesToHex(signingData(json));
}

function encodeForMultisigning(json, signer) {
  assert(typeof json === 'object');
  assert.equal(json.SigningPubKey, '');
  return bytesToHex(multiSigningData(json, signer));
}

function encodeQuality(value) {
  assert(typeof value === 'string');
  return bytesToHex(quality.encode(value));
}

function decodeQuality(value) {
  assert(typeof value === 'string');
  return quality.decode(value).toString();
}

module.exports = {
  decode,
  encode,
  encodeForSigning,
  encodeForMultisigning,
  encodeQuality,
  decodeQuality
};
