'use strict';

const assert = require('assert');
const coreTypes = require('@niq/ripple-core-types');
const {binary: {bytesToHex, binaryToJSON, serializeObject}} = coreTypes;

exports.decode = function(binary) {
  assert(typeof binary === 'string');
  return binaryToJSON(binary);
};

exports.encode = function(json) {
  assert(typeof json === 'object');
  return bytesToHex(serializeObject(json));
};
