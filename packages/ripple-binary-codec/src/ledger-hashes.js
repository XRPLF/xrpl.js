'use strict';

const _ = require('lodash');
const BN = require('bn.js');
const assert = require('assert');
const types = require('./types');
const {STObject, Hash256} = types;
const {ShaMap} = require('./shamap');
const {HashPrefix} = require('./hash-prefixes');
const {Sha512Half} = require('./hashes');
const {BinarySerializer, serializeObject} = require('./binary');

function computeHash(itemizer, itemsJson) {
  const map = new ShaMap();
  itemsJson.forEach(item => map.addItem(...itemizer(item)));
  return map.hash();
}

function transactionItem(json) {
  assert(json.hash);
  const index = Hash256.from(json.hash);
  const item = {
    hashPrefix() {
      return HashPrefix.transaction;
    },
    toBytesSink(sink) {
      const serializer = new BinarySerializer(sink);
      serializer.writeLengthEncoded(STObject.from(json));
      serializer.writeLengthEncoded(STObject.from(json.metaData));
    }
  };
  return [index, item];
}

function entryItem(json) {
  const index = Hash256.from(json.index);
  const bytes = serializeObject(json);
  const item = {
    hashPrefix() {
      return HashPrefix.accountStateEntry;
    },
    toBytesSink(sink) {
      sink.put(bytes);
    }
  };
  return [index, item];
}

const transactionTreeHash = _.partial(computeHash, transactionItem);
const accountStateHash = _.partial(computeHash, entryItem);

function ledgerHash(header) {
  const hash = new Sha512Half();
  hash.put(HashPrefix.ledgerHeader);
  assert(header.parent_close_time !== undefined);
  assert(header.close_flags !== undefined);

  types.UInt32.from(header.ledger_index).toBytesSink(hash);
  types.UInt64.from(new BN(header.total_coins)).toBytesSink(hash);
  types.Hash256.from(header.parent_hash).toBytesSink(hash);
  types.Hash256.from(header.transaction_hash).toBytesSink(hash);
  types.Hash256.from(header.account_hash).toBytesSink(hash);
  types.UInt32.from(header.parent_close_time).toBytesSink(hash);
  types.UInt32.from(header.close_time).toBytesSink(hash);
  types.UInt8.from(header.close_time_resolution).toBytesSink(hash);
  types.UInt8.from(header.close_flags).toBytesSink(hash);
  return hash.finish();
}

module.exports = {
  accountStateHash,
  transactionTreeHash,
  ledgerHash
};
