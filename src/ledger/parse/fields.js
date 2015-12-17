/* @flow */
'use strict';
const _ = require('lodash');
const BigNumber = require('bignumber.js');
const AccountFields = require('./utils').constants.AccountFields;

function parseField(info, value) {
  if (info.encoding === 'hex' && !info.length) {  // e.g. "domain"
    return new Buffer(value, 'hex').toString('ascii');
  }
  if (info.shift) {
    return (new BigNumber(value)).shift(-info.shift).toNumber();
  }
  return value;
}

function parseFields(data: Object): Object {
  const settings = {};
  for (const fieldName in AccountFields) {
    const fieldValue = data[fieldName];
    if (fieldValue !== undefined) {
      const info = AccountFields[fieldName];
      settings[info.name] = parseField(info, fieldValue);
    }
  }

  if (data.RegularKey) {
    settings.regularKey = data.RegularKey;
  }

  // TODO: this isn't implemented in rippled yet, may have to change this later
  if (data.SignerQuorum || data.SignerEntries) {
    settings.signers = {};
    if (data.SignerQuorum) {
      settings.signers.threshold = data.SignerQuorum;
    }
    if (data.SignerEntries) {
      settings.signers.weights = _.map(data.SignerEntries, entry => {
        return {
          address: entry.SignerEntry.Account,
          weight: entry.SignerEntry.SignerWeight
        };
      });
    }
  }
  return settings;
}

module.exports = parseFields;
