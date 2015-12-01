/* @flow */
'use strict';

const _ = require('lodash');
const assert = require('assert');
const utils = require('./utils');
const validate = utils.common.validate;

function createSignersTransaction(account: string, signersArgument) {
  const txJSON: Object = {
    TransactionType: 'SignerListSet',
    Account: account
  };

  if (!_.isUndefined(signersArgument.quorum)) {
    txJSON.SignerQuorum = signersArgument.quorum;
  }
  if (!_.isUndefined(signersArgument.entries)) {
    txJSON.SignerEntries = signersArgument.entries.map((signer) => {
      return {
        SignerEntry: {
          Account: signer.address,
          SignerWeight: signer.weight
        }
      }
    });
  }

  return txJSON;
}

function prepareSigners(address: string, signers, instructions) {
  validate.prepareSigners({address, signers, instructions});
  const txJSON = createSignersTransaction(address, signers);
  return utils.prepareTransaction(txJSON, this, instructions);
}

module.exports = prepareSigners;
