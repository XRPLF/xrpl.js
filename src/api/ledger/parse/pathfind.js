/* @flow */
'use strict';
const _ = require('lodash');
const parseAmount = require('./amount');

function parsePaths(paths) {
  return paths.map(steps => steps.map(step =>
    _.omit(step, ['type', 'type_hex'])));
}

function parsePathfind(sourceAddress: string,
    destinationAmount: Object, pathfindResult: Object): Object {
  return pathfindResult.alternatives.map(function(alternative) {
    return {
      source: {
        address: sourceAddress,
        amount: parseAmount(alternative.source_amount)
      },
      destination: {
        address: pathfindResult.destination_account,
        amount: destinationAmount
      },
      paths: JSON.stringify(parsePaths(alternative.paths_computed))
    };
  });
}

module.exports = parsePathfind;
