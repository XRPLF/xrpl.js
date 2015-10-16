'use strict';
const utils = require('./utils');

module.exports = {
  Connection: require('./connection'),
  core: utils.core,
  constants: require('./constants'),
  errors: require('./errors'),
  validate: require('./validate'),
  dropsToXrp: utils.dropsToXrp,
  xrpToDrops: utils.xrpToDrops,
  toRippledAmount: utils.toRippledAmount,
  generateAddress: utils.generateAddress,
  composeAsync: utils.composeAsync,
  wrapCatch: utils.wrapCatch,
  convertErrors: utils.convertErrors,
  convertExceptions: utils.convertExceptions,
  convertKeysFromSnakeCaseToCamelCase:
    utils.convertKeysFromSnakeCaseToCamelCase,
  promisify: utils.promisify
};
