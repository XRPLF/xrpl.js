'use strict';
const utils = require('./utils');

module.exports = {
  Connection: require('./connection'),
  constants: require('./constants'),
  errors: require('./errors'),
  validate: require('./validate'),
  txFlags: require('./txflags').txFlags,
  serverInfo: require('./serverinfo'),
  dropsToXrp: utils.dropsToXrp,
  xrpToDrops: utils.xrpToDrops,
  toRippledAmount: utils.toRippledAmount,
  generateAddress: utils.generateAddress,
  generateAddressAPI: utils.generateAddressAPI,
  removeUndefined: utils.removeUndefined,
  convertKeysFromSnakeCaseToCamelCase:
    utils.convertKeysFromSnakeCaseToCamelCase,
  iso8601ToRippleTime: utils.iso8601ToRippleTime,
  rippleTimeToISO8601: utils.rippleTimeToISO8601
};
