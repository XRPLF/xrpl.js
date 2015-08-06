'use strict';
const core = require('./core');
const RippleAPI = require('./api');

module.exports = {
  RippleAPI,
  _DEPRECATED: core   // WARNING: this will be removed soon
};
