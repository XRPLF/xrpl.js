'use strict';
const AccountFields = require('./utils').constants.AccountFields;

function parseField(info, value) {
  if (info.encoding === 'hex' && !info.length) {
    return new Buffer(value, 'hex').toString('ascii');
  }
  return value;
}

function parseFields(data) {
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
