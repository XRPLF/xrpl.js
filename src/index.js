'use strict';

/* eslint-disable max-len */
// Enable core-js polyfills. This allows use of ES6/7 extensions listed here:
// https://github.com/zloirock/core-js/blob/fb0890f32dabe8d4d88a4350d1b268446127132e/shim.js#L1-L103
/* eslint-enable max-len */
require('babel-core/polyfill');

const core = require('./core');
const RippleAPI = require('./api');

module.exports = {
  RippleAPI,
  _DEPRECATED: core   // WARNING: this will be removed soon
};
