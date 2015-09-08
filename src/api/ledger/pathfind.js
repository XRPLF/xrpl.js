/* @flow */
'use strict';
const _ = require('lodash');
const async = require('async');
const BigNumber = require('bignumber.js');
const utils = require('./utils');
const validate = utils.common.validate;
const parsePathfind = require('./parse/pathfind');
const NotFoundError = utils.common.errors.NotFoundError;
const composeAsync = utils.common.composeAsync;
const convertErrors = utils.common.convertErrors;

type PathFindParams = {
  src_currencies?: Array<string>, src_account: string, dst_amount: string,
  dst_account?: string
}

function addParams(params: PathFindParams, result: {}) {
  return _.assign({}, result, {
    source_account: params.src_account,
    source_currencies: params.src_currencies,
    destination_amount: params.dst_amount
  });
}

type PathFind = {
  source: {address: string, currencies: Array<string>},
  destination: {address: string, amount: string}
}

function requestPathFind(remote, pathfind: PathFind, callback) {
  const params: PathFindParams = {
    src_account: pathfind.source.address,
    dst_account: pathfind.destination.address,
    dst_amount: utils.common.toRippledAmount(pathfind.destination.amount)
  };
  if (typeof params.dst_amount === 'object' && !params.dst_amount.issuer) {
    // Convert blank issuer to sender's address
    // (Ripple convention for 'any issuer')
    // https://ripple.com/build/transactions/
    //     #special-issuer-values-for-sendmax-and-amount
    // https://ripple.com/build/ripple-rest/#counterparties-in-payments
    params.dst_amount.issuer = params.dst_account;
  }
  if (pathfind.source.currencies && pathfind.source.currencies.length > 0) {
    params.src_currencies = pathfind.source.currencies.map(amount =>
      _.omit(utils.common.toRippledAmount(amount), 'value'));
  }

  remote.createPathFind(params,
    composeAsync(_.partial(addParams, params), convertErrors(callback)));
}

function addDirectXrpPath(paths, xrpBalance) {
  // Add XRP "path" only if the source acct has enough XRP to make the payment
  const destinationAmount = paths.destination_amount;
  if ((new BigNumber(xrpBalance)).greaterThanOrEqualTo(destinationAmount)) {
    paths.alternatives.unshift({
      paths_computed: [],
      source_amount: paths.destination_amount
    });
  }
  return paths;
}

function isRippledIOUAmount(amount) {
  // rippled XRP amounts are specified as decimal strings
  return (typeof amount === 'object') &&
    amount.currency && (amount.currency !== 'XRP');
}

function conditionallyAddDirectXRPPath(remote, address, paths, callback) {
  if (isRippledIOUAmount(paths.destination_amount)
      || !_.includes(paths.destination_currencies, 'XRP')) {
    callback(null, paths);
  } else {
    utils.getXRPBalance(remote, address, undefined,
      composeAsync(_.partial(addDirectXrpPath, paths), callback));
  }
}

function formatResponse(pathfind, paths) {
  if (paths.alternatives && paths.alternatives.length > 0) {
    const address = pathfind.source.address;
    return parsePathfind(address, pathfind.destination.amount, paths);
  }
  if (paths.destination_currencies !== undefined &&
      !_.includes(paths.destination_currencies,
      pathfind.destination.amount.currency)) {
    throw new NotFoundError('No paths found. ' +
      'The destination_account does not accept ' +
      pathfind.destination.amount.currency + ', they only accept: ' +
      paths.destination_currencies.join(', '));
  } else if (paths.source_currencies && paths.source_currencies.length > 0) {
    throw new NotFoundError('No paths found. Please ensure' +
      ' that the source_account has sufficient funds to execute' +
      ' the payment in one of the specified source_currencies. If it does' +
      ' there may be insufficient liquidity in the network to execute' +
      ' this payment right now');
  } else {
    throw new NotFoundError('No paths found.' +
      ' Please ensure that the source_account has sufficient funds to' +
      ' execute the payment. If it does there may be insufficient liquidity' +
      ' in the network to execute this payment right now');
  }
}

function getPathsAsync(pathfind, callback) {
  validate.pathfind(pathfind);

  const address = pathfind.source.address;
  async.waterfall([
    _.partial(requestPathFind, this.remote, pathfind),
    _.partial(conditionallyAddDirectXRPPath, this.remote, address)
  ], composeAsync(_.partial(formatResponse, pathfind), callback));
}

function getPaths(pathfind: Object) {
  return utils.promisify(getPathsAsync).call(this, pathfind);
}

module.exports = getPaths;
