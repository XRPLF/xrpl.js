const enums = require('../enums');
const {Field} = enums;
const {AccountID} = require('./account-id');
const {Amount} = require('./amount');
const {Blob} = require('./blob');
const {Currency} = require('./currency');
const {Hash128} = require('./hash-128');
const {Hash160} = require('./hash-160');
const {Hash256} = require('./hash-256');
const {PathSet} = require('./path-set');
const {STArray} = require('./st-array');
const {STObject} = require('./st-object');
const {UInt16} = require('./uint-16');
const {UInt32} = require('./uint-32');
const {UInt64} = require('./uint-64');
const {UInt8} = require('./uint-8');
const {Vector256} = require('./vector-256');

const coreTypes = {
  AccountID,
  Amount,
  Blob,
  Currency,
  Hash128,
  Hash160,
  Hash256,
  PathSet,
  STArray,
  STObject,
  UInt8,
  UInt16,
  UInt32,
  UInt64,
  Vector256
};

Field.values.forEach(field => {
  field.associatedType = coreTypes[field.type];
});

Field.TransactionType.associatedType = enums.TransactionType;
Field.TransactionResult.associatedType = enums.TransactionResult;
Field.LedgerEntryType.associatedType = enums.LedgerEntryType;

module.exports = coreTypes;
