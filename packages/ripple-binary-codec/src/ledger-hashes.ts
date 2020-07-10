import * as _ from "lodash";
import { strict as assert } from "assert";
import { coreTypes } from "./types";
const { STObject, Hash256 } = coreTypes;
import { ShaMap } from "./shamap";
import { HashPrefix } from "./hash-prefixes";
import { Sha512Half } from "./hashes";
import { BinarySerializer, serializeObject } from "./binary";

function computeHash(itemizer, itemsJson) {
  const map = new ShaMap();
  itemsJson.forEach((item) => map.addItem(...itemizer(item)));
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
    },
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
    },
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

  coreTypes.UInt32.from(header.ledger_index).toBytesSink(hash);
  coreTypes.UInt64.from(BigInt(header.total_coins)).toBytesSink(hash);
  coreTypes.Hash256.from(header.parent_hash).toBytesSink(hash);
  coreTypes.Hash256.from(header.transaction_hash).toBytesSink(hash);
  coreTypes.Hash256.from(header.account_hash).toBytesSink(hash);
  coreTypes.UInt32.from(header.parent_close_time).toBytesSink(hash);
  coreTypes.UInt32.from(header.close_time).toBytesSink(hash);
  coreTypes.UInt8.from(header.close_time_resolution).toBytesSink(hash);
  coreTypes.UInt8.from(header.close_flags).toBytesSink(hash);
  return hash.finish();
}

export { accountStateHash, transactionTreeHash, ledgerHash };
