/* @flow */
'use strict';
const _ = require('lodash');
const assert = require('assert');
const AccountFlags = require('./utils').constants.AccountFlags;
const parseFields = require('./fields');

function getAccountRootModifiedNode(tx: Object) {
  const modifiedNodes = tx.meta.AffectedNodes.filter(node =>
    node.ModifiedNode.LedgerEntryType === 'AccountRoot');
  assert(modifiedNodes.length === 1);
  return modifiedNodes[0].ModifiedNode;
}

function parseFlags(tx: Object) {
  const settings = {};
  if (tx.TransactionType !== 'AccountSet') {
    return settings;
  }

  const node = getAccountRootModifiedNode(tx);
  const oldFlags = _.get(node.PreviousFields, 'Flags');
  const newFlags = _.get(node.FinalFields, 'Flags');

  if (oldFlags !== undefined && newFlags !== undefined) {
    const changedFlags = oldFlags ^ newFlags;
    const setFlags = newFlags & changedFlags;
    const clearedFlags = oldFlags & changedFlags;
    _.forEach(AccountFlags, (flagValue, flagName) => {
      if (setFlags & flagValue) {
        settings[flagName] = true;
      } else if (clearedFlags & flagValue) {
        settings[flagName] = false;
      }
    });
  }

  // enableTransactionIDTracking requires a special case because it
  // does not affect the Flags field; instead it adds/removes a field called
  // "AccountTxnID" to/from the account root.

  const oldField = _.get(node.PreviousFields, 'AccountTxnID');
  const newField = _.get(node.FinalFields, 'AccountTxnID');
  if (newField && !oldField) {
    settings.enableTransactionIDTracking = true;
  } else if (oldField && !newField) {
    settings.enableTransactionIDTracking = false;
  }

  return settings;
}

function parseSettings(tx: Object) {
  const txType = tx.TransactionType;
  assert(txType === 'AccountSet' || txType === 'SetRegularKey' ||
         txType === 'SignerListSet');

  return _.assign({}, parseFlags(tx), parseFields(tx));
}

module.exports = parseSettings;
