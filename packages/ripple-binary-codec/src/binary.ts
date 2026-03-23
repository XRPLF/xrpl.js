/* eslint-disable func-style */

import { bytesToHex } from '@xrplf/isomorphic/utils'
import { coreTypes } from './types'
import { BinaryParser } from './serdes/binary-parser'
import { AccountID } from './types/account-id'
import { HashPrefix } from './hash-prefixes'
import { BinarySerializer, BytesList } from './serdes/binary-serializer'
import { sha512Half, transactionID } from './hashes'
import {
  type XrplDefinitionsBase,
  DEFAULT_DEFINITIONS,
  type FieldInstance,
} from './enums'
import { STObject } from './types/st-object'
import { JsonObject } from './types/serialized-type'

/**
 * Construct a BinaryParser
 *
 * @param bytes hex-string or Uint8Array to construct BinaryParser from
 * @param definitions rippled definitions used to parse the values of transaction types and such.
 *                          Can be customized for sidechains and amendments.
 * @returns BinaryParser
 */
const makeParser = (
  bytes: string | Uint8Array,
  definitions?: XrplDefinitionsBase,
): BinaryParser =>
  new BinaryParser(
    bytes instanceof Uint8Array ? bytesToHex(bytes) : bytes,
    definitions,
  )

/**
 * Parse BinaryParser into JSON
 *
 * @param parser BinaryParser object
 * @param definitions rippled definitions used to parse the values of transaction types and such.
 *                          Can be customized for sidechains and amendments.
 * @returns JSON for the bytes in the BinaryParser
 */
const readJSON = (
  parser: BinaryParser,
  definitions: XrplDefinitionsBase = DEFAULT_DEFINITIONS,
): JsonObject =>
  (parser.readType(coreTypes.STObject) as STObject).toJSON(definitions)

/**
 * Parse a hex-string into its JSON interpretation
 *
 * @param bytes hex-string to parse into JSON
 * @param definitions rippled definitions used to parse the values of transaction types and such.
 *                          Can be customized for sidechains and amendments.
 * @returns JSON
 */
const binaryToJSON = (
  bytes: string,
  definitions?: XrplDefinitionsBase,
): JsonObject => readJSON(makeParser(bytes, definitions), definitions)

/**
 * Interface for passing parameters to SerializeObject
 *
 * @field set signingFieldOnly to true if you want to serialize only signing fields
 */
interface OptionObject {
  prefix?: Uint8Array
  suffix?: Uint8Array
  signingFieldsOnly?: boolean
  definitions?: XrplDefinitionsBase
}

/**
 * Function to serialize JSON object representing a transaction
 *
 * @param object JSON object to serialize
 * @param opts options for serializing, including optional prefix, suffix, signingFieldOnly, and definitions
 * @returns A Uint8Array containing the serialized object
 */
function serializeObject(
  object: JsonObject,
  opts: OptionObject = {},
): Uint8Array {
  const { prefix, suffix, signingFieldsOnly = false, definitions } = opts
  const bytesList = new BytesList()

  if (prefix) {
    bytesList.put(prefix)
  }

  const filter = signingFieldsOnly
    ? (f: FieldInstance): boolean => f.isSigningField
    : undefined
  ;(coreTypes.STObject as typeof STObject)
    .from(object, filter, definitions)
    .toBytesSink(bytesList)

  if (suffix) {
    bytesList.put(suffix)
  }

  return bytesList.toBytes()
}

/**
 * Serialize an object for signing
 *
 * @param transaction Transaction to serialize
 * @param prefix Prefix bytes to put before the serialized object
 * @param opts.definitions Custom rippled types to use instead of the default. Used for sidechains and amendments.
 * @returns A Uint8Array with the serialized object
 */
function signingData(
  transaction: JsonObject,
  prefix: Uint8Array = HashPrefix.transactionSig,
  opts: { definitions?: XrplDefinitionsBase } = {},
): Uint8Array {
  return serializeObject(transaction, {
    prefix,
    signingFieldsOnly: true,
    definitions: opts.definitions,
  })
}

/**
 * Interface describing fields required for a Claim
 */
interface ClaimObject extends JsonObject {
  channel: string
  amount: string | number
}

/**
 * Serialize a signingClaim
 *
 * @param claim A claim object to serialize
 * @param opts.definitions Custom rippled types to use instead of the default. Used for sidechains and amendments.
 * @returns the serialized object with appropriate prefix
 */
function signingClaimData(claim: ClaimObject): Uint8Array {
  const num = BigInt(String(claim.amount))
  const prefix = HashPrefix.paymentChannelClaim
  const channel = coreTypes.Hash256.from(claim.channel).toBytes()
  const amount = coreTypes.UInt64.from(num).toBytes()

  const bytesList = new BytesList()

  bytesList.put(prefix)
  bytesList.put(channel)
  bytesList.put(amount)
  return bytesList.toBytes()
}

/**
 * Serialize a transaction object for multiSigning
 *
 * @param transaction transaction to serialize
 * @param signingAccount Account to sign the transaction with
 * @param opts.definitions Custom rippled types to use instead of the default. Used for sidechains and amendments.
 * @returns serialized transaction with appropriate prefix and suffix
 */
function multiSigningData(
  transaction: JsonObject,
  signingAccount: string | AccountID,
  opts: { definitions: XrplDefinitionsBase } = {
    definitions: DEFAULT_DEFINITIONS,
  },
): Uint8Array {
  const prefix = HashPrefix.transactionMultiSig
  const suffix = coreTypes.AccountID.from(signingAccount).toBytes()
  return serializeObject(transaction, {
    prefix,
    suffix,
    signingFieldsOnly: true,
    definitions: opts.definitions,
  })
}

/**
 * Interface describing fields required for a Batch signer
 * @property flags - Flags indicating Batch transaction properties
 * @property txIDs - Array of transaction IDs included in the Batch
 */
interface BatchObject extends JsonObject {
  flags: number
  txIDs: string[]
}

/**
 * Serialize a signingClaim
 *
 * @param batch A Batch object to serialize.
 * @returns the serialized object with appropriate prefix
 */
function signingBatchData(batch: BatchObject): Uint8Array {
  if (batch.flags == null) {
    throw Error("No field `flags'")
  }
  if (batch.txIDs == null) {
    throw Error('No field `txIDs`')
  }
  const prefix = HashPrefix.batch
  const flags = coreTypes.UInt32.from(batch.flags).toBytes()
  const txIDsLength = coreTypes.UInt32.from(batch.txIDs.length).toBytes()

  const bytesList = new BytesList()

  bytesList.put(prefix)
  bytesList.put(flags)
  bytesList.put(txIDsLength)
  batch.txIDs.forEach((txID: string) => {
    bytesList.put(coreTypes.Hash256.from(txID).toBytes())
  })

  return bytesList.toBytes()
}

export {
  BinaryParser,
  BinarySerializer,
  BytesList,
  ClaimObject,
  BatchObject,
  makeParser,
  serializeObject,
  readJSON,
  multiSigningData,
  signingData,
  signingClaimData,
  binaryToJSON,
  sha512Half,
  transactionID,
  signingBatchData,
}
