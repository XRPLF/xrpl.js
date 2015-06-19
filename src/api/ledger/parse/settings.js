/* @flow */
'use strict';
const _ = require('lodash');
const assert = require('assert');
const AccountSetFlags = require('./utils').constants.AccountSetFlags;
const parseFields = require('./fields');

function getName(flagNumber) {
  return _.findKey(AccountSetFlags, (v) => v === flagNumber);
}

function parseSettings(tx: Object) {
  const txType = tx.TransactionType;
  assert(txType === 'AccountSet' || txType === 'SetRegularKey');
  const settings = {};
  if (tx.SetFlag) {
    settings[getName(tx.SetFlag)] = true;
  }
  if (tx.ClearFlag) {
    settings[getName(tx.ClearFlag)] = false;
  }
  if (tx.RegularKey) {
    settings.regularKey = tx.RegularKey;
  }
  return _.assign(settings, parseFields(tx));
}

module.exports = parseSettings;
