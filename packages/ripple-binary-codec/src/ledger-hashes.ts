import * as assert from 'assert'
import { ShaMap, ShaMapNode, ShaMapLeaf } from './shamap'
import { HashPrefix } from './hash-prefixes'
import { Sha512Half } from './hashes'
import { BinarySerializer, serializeObject } from './binary'
import { Hash256 } from './types/hash-256'
import { STObject } from './types/st-object'
import { UInt64 } from './types/uint-64'
import { UInt32 } from './types/uint-32'
import { UInt8 } from './types/uint-8'
import { BinaryParser } from './serdes/binary-parser'
import { JsonObject } from './types/serialized-type'
import bigInt = require('big-integer')
import { XrplDefinitionsBase } from './enums'

/**
 * Computes the hash of a list of objects
 *
 * @param itemizer Converts an item into a format that can be added to SHAMap
 * @param itemsJson Array of items to add to a SHAMap
 * @returns the hash of the SHAMap
 */
function computeHash(
  itemizer: (item: JsonObject) => [Hash256?, ShaMapNode?, ShaMapLeaf?],
  itemsJson: Array<JsonObject>,
): Hash256 {
  const map = new ShaMap()
  itemsJson.forEach((item) => map.addItem(...itemizer(item)))
  return map.hash()
}

/**
 * Interface describing a transaction item
 */
interface transactionItemObject extends JsonObject {
  hash: string
  metaData: JsonObject
}

/**
 * Convert a transaction into an index and an item
 *
 * @param json transaction with metadata
 * @returns a tuple of index and item to be added to SHAMap
 */
function transactionItemizer(
  json: transactionItemObject,
): [Hash256, ShaMapNode, undefined] {
  assert.ok(json.hash)
  const index = Hash256.from(json.hash)
  const item = {
    hashPrefix() {
      return HashPrefix.transaction
    },
    toBytesSink(sink) {
      const serializer = new BinarySerializer(sink)
      serializer.writeLengthEncoded(STObject.from(json))
      serializer.writeLengthEncoded(STObject.from(json.metaData))
    },
  } as ShaMapNode
  return [index, item, undefined]
}

/**
 * Interface describing an entry item
 */
interface entryItemObject extends JsonObject {
  index: string
}

/**
 * Convert an entry to a pair Hash256 and ShaMapNode
 *
 * @param json JSON describing a ledger entry item
 * @returns a tuple of index and item to be added to SHAMap
 */
function entryItemizer(
  json: entryItemObject,
): [Hash256, ShaMapNode, undefined] {
  const index = Hash256.from(json.index)
  const bytes = serializeObject(json)
  const item = {
    hashPrefix() {
      return HashPrefix.accountStateEntry
    },
    toBytesSink(sink) {
      sink.put(bytes)
    },
  } as ShaMapNode
  return [index, item, undefined]
}

/**
 * Function computing the hash of a transaction tree
 *
 * @param param An array of transaction objects to hash
 * @returns A Hash256 object
 */
function transactionTreeHash(param: Array<JsonObject>): Hash256 {
  const itemizer = transactionItemizer as (
    json: JsonObject,
  ) => [Hash256, ShaMapNode, undefined]
  return computeHash(itemizer, param)
}

/**
 * Function computing the hash of accountState
 *
 * @param param A list of accountStates hash
 * @returns A Hash256 object
 */
function accountStateHash(param: Array<JsonObject>): Hash256 {
  const itemizer = entryItemizer as (
    json: JsonObject,
  ) => [Hash256, ShaMapNode, undefined]
  return computeHash(itemizer, param)
}

/**
 * Interface describing a ledger header
 */
interface ledgerObject {
  ledger_index: number
  total_coins: string | number | bigInt.BigInteger
  parent_hash: string
  transaction_hash: string
  account_hash: string
  parent_close_time: number
  close_time: number
  close_time_resolution: number
  close_flags: number
}

/**
 * Serialize and hash a ledger header
 *
 * @param header a ledger header
 * @returns the hash of header
 */
function ledgerHash(header: ledgerObject): Hash256 {
  const hash = new Sha512Half()
  hash.put(HashPrefix.ledgerHeader)
  assert.ok(header.parent_close_time !== undefined)
  assert.ok(header.close_flags !== undefined)

  UInt32.from<number>(header.ledger_index).toBytesSink(hash)
  UInt64.from<bigInt.BigInteger>(
    bigInt(String(header.total_coins)),
  ).toBytesSink(hash)
  Hash256.from<string>(header.parent_hash).toBytesSink(hash)
  Hash256.from<string>(header.transaction_hash).toBytesSink(hash)
  Hash256.from<string>(header.account_hash).toBytesSink(hash)
  UInt32.from<number>(header.parent_close_time).toBytesSink(hash)
  UInt32.from<number>(header.close_time).toBytesSink(hash)
  UInt8.from<number>(header.close_time_resolution).toBytesSink(hash)
  UInt8.from<number>(header.close_flags).toBytesSink(hash)
  return hash.finish()
}

/**
 * Decodes a serialized ledger header
 *
 * @param binary A serialized ledger header
 * @param definitions Type definitions to parse the ledger objects.
 *      Used if there are non-default ledger objects to decode.
 * @returns A JSON object describing a ledger header
 */
function decodeLedgerData(
  binary: string,
  definitions?: XrplDefinitionsBase,
): object {
  assert.ok(typeof binary === 'string', 'binary must be a hex string')
  const parser = new BinaryParser(binary, definitions)
  return {
    ledger_index: parser.readUInt32(),
    total_coins: parser.readType(UInt64).valueOf().toString(),
    parent_hash: parser.readType(Hash256).toHex(),
    transaction_hash: parser.readType(Hash256).toHex(),
    account_hash: parser.readType(Hash256).toHex(),
    parent_close_time: parser.readUInt32(),
    close_time: parser.readUInt32(),
    close_time_resolution: parser.readUInt8(),
    close_flags: parser.readUInt8(),
  }
}

export { accountStateHash, transactionTreeHash, ledgerHash, decodeLedgerData }
