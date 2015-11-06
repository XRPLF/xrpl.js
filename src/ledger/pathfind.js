/* @flow */
'use strict';
const _ = require('lodash');
const BigNumber = require('bignumber.js');
const utils = require('./utils');
const parsePathfind = require('./parse/pathfind');
const {validate, toRippledAmount} = utils.common;
const NotFoundError = utils.common.errors.NotFoundError;
const ValidationError = utils.common.errors.ValidationError;
import type {Connection} from '../common/connection';
import type {RippledAmount} from '../common/types.js';
import type {GetPaths, PathFind, RippledPathsResponse, PathFindRequest}
  from './pathfind-types.js';


function addParams(request: PathFindRequest, result: RippledPathsResponse) {
  return _.defaults(_.assign({}, result, {
    source_account: request.source_account,
    source_currencies: request.source_currencies
  }), {destination_amount: request.destination_amount});
}

function requestPathFind(connection: Connection, pathfind: PathFind): Promise {
  const destinationAmount = _.assign({value: -1}, pathfind.destination.amount);
  const request: PathFindRequest = {
    command: 'ripple_path_find',
    source_account: pathfind.source.address,
    destination_account: pathfind.destination.address,
    destination_amount: toRippledAmount(destinationAmount)
  };
  if (typeof request.destination_amount === 'object'
      && !request.destination_amount.issuer) {
    // Convert blank issuer to sender's address
    // (Ripple convention for 'any issuer')
    // https://ripple.com/build/transactions/
    //     #special-issuer-values-for-sendmax-and-amount
    // https://ripple.com/build/ripple-rest/#counterparties-in-payments
    request.destination_amount.issuer = request.destination_account;
  }
  if (pathfind.source.currencies && pathfind.source.currencies.length > 0) {
    request.source_currencies = pathfind.source.currencies.map(amount =>
      _.omit(toRippledAmount(amount), 'value'));
  }
  if (pathfind.source.amount) {
    if (pathfind.destination.amount.value !== undefined) {
      throw new ValidationError('Cannot specify both source.amount'
        + ' and destination.amount.value in getPaths');
    }
    request.source_amount = toRippledAmount(pathfind.source.amount);
    if (request.source_amount.currency && !request.source_amount.issuer) {
      request.source_amount.issuer = pathfind.source.address;
    }
  }

  return connection.request(request).then(paths => addParams(request, paths));
}

function addDirectXrpPath(paths: RippledPathsResponse, xrpBalance: string
): RippledPathsResponse {
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

function isRippledIOUAmount(amount: RippledAmount) {
  // rippled XRP amounts are specified as decimal strings
  return (typeof amount === 'object') &&
    amount.currency && (amount.currency !== 'XRP');
}

function conditionallyAddDirectXRPPath(connection: Connection, address: string,
  paths: RippledPathsResponse
): Promise {
  if (isRippledIOUAmount(paths.destination_amount)
      || !_.includes(paths.destination_currencies, 'XRP')) {
    return Promise.resolve(paths);
  }
  return utils.getXRPBalance(connection, address, undefined).then(
    xrpBalance => addDirectXrpPath(paths, xrpBalance));
}

function formatResponse(pathfind: PathFind, paths: RippledPathsResponse) {
  if (paths.alternatives && paths.alternatives.length > 0) {
    return parsePathfind(paths);
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

function getPaths(pathfind: PathFind): Promise<GetPaths> {
  validate.getPaths({pathfind});

  const address = pathfind.source.address;
  return requestPathFind(this.connection, pathfind).then(paths =>
    conditionallyAddDirectXRPPath(this.connection, address, paths)
  ).then(paths => formatResponse(pathfind, paths));
}

module.exports = getPaths;
