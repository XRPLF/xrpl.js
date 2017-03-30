/* eslint-disable func-style */

const BN = require('bn.js');
const types = require('./types');
const {HashPrefix} = require('./hash-prefixes');
const {BinaryParser} = require('./serdes/binary-parser');
const {BinarySerializer, BytesList} = require('./serdes/binary-serializer');
const {bytesToHex, slice, parseBytes} = require('./utils/bytes-utils');

const {sha512Half, transactionID} = require('./hashes');

const makeParser = bytes => new BinaryParser(bytes);
const readJSON = parser => parser.readType(types.STObject).toJSON();
const binaryToJSON = bytes => readJSON(makeParser(bytes));

function serializeObject(object, opts = {}) {
  const {prefix, suffix, signingFieldsOnly = false} = opts;
  const bytesList = new BytesList();
  if (prefix) {
    bytesList.put(prefix);
  }
  const filter = signingFieldsOnly ? f => f.isSigningField : undefined;
  types.STObject.from(object).toBytesSink(bytesList, filter);
  if (suffix) {
    bytesList.put(suffix);
  }
  return bytesList.toBytes();
}

function signingData(tx, prefix = HashPrefix.transactionSig) {
  return serializeObject(tx, {prefix, signingFieldsOnly: true});
}

function signingClaimData(claim) {
  const prefix = HashPrefix.paymentChannelClaim
  const channel = types.Hash256.from(claim.channel).toBytes()
  const amount = new types.UInt64(new BN(claim.amount)).toBytes();

  const bytesList = new BytesList();

  bytesList.put(prefix)
  bytesList.put(channel)
  bytesList.put(amount)
  return bytesList.toBytes()
}

function multiSigningData(tx, signingAccount) {
  const prefix = HashPrefix.transactionMultiSig;
  const suffix = types.AccountID.from(signingAccount).toBytes();
  return serializeObject(tx, {prefix, suffix, signingFieldsOnly: true});
}

module.exports = {
  BinaryParser,
  BinarySerializer,
  BytesList,
  makeParser,
  serializeObject,
  readJSON,
  bytesToHex,
  parseBytes,
  multiSigningData,
  signingData,
  signingClaimData,
  binaryToJSON,
  sha512Half,
  transactionID,
  slice
};
