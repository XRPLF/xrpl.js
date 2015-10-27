/* @flow */
'use strict';
const BigNumber = require('bignumber.js');
const AccountFields = require('./utils').constants.AccountFields;

function parseField(info, value) {
  if (info.encoding === 'hex' && !info.length) {
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
  return settings;
}

module.exports = parseFields;
