'use strict';
const utils = require('./utils');

module.exports = {
  core: utils.core,
  constants: require('./constants'),
  errors: require('./errors'),
  validate: require('./validate'),
  dropsToXrp: utils.dropsToXrp,
  xrpToDrops: utils.xrpToDrops,
  toRippledAmount: utils.toRippledAmount,
  generateWallet: utils.generateWallet,
  composeAsync: utils.composeAsync,
  wrapCatch: utils.wrapCatch,
  convertExceptions: utils.convertExceptions,
  convertKeysFromSnakeCaseToCamelCase:
    utils.convertKeysFromSnakeCaseToCamelCase,
  promisify: utils.promisify,
  isValidAddress: require('./schema-validator').isValidAddress
};
