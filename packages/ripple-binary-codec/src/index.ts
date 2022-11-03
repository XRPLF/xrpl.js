import * as assert from 'assert'
import { quality, binary, HashPrefix } from './coretypes'
import { decodeLedgerData } from './ledger-hashes'
import { ClaimObject } from './binary'
import { JsonObject } from './types/serialized-type'
import { DefinitionContents, DEFINITIONS, TRANSACTION_TYPES } from './enums'

const {
  signingData,
  signingClaimData,
  multiSigningData,
  binaryToJSON,
  serializeObject,
} = binary

/**
 * Decode a transaction
 *
 * @param binary hex-string of the encoded transaction
 * @param customDefinitions Custom rippled types to use instead of the default. Used for sidechains and amendments.
 * @returns the JSON representation of the transaction
 */
function decode(
  binary: string,
  customDefinitions: DefinitionContents = DEFINITIONS,
): JsonObject {
  assert.ok(typeof binary === 'string', 'binary must be a hex string')
  return binaryToJSON(binary, customDefinitions)
}

/**
 * Encode a transaction
 *
 * @param json The JSON representation of a transaction
 * @param customDefinitions Custom rippled types to use instead of the default. Used for sidechains and amendments.
 *
 * @returns A hex-string of the encoded transaction
 */
function encode(
  json: object,
  customDefinitions: DefinitionContents = DEFINITIONS,
): string {
  assert.ok(typeof json === 'object')
  return serializeObject(json as JsonObject, { customDefinitions })
    .toString('hex')
    .toUpperCase()
}

/**
 * Encode a transaction and prepare for signing
 *
 * @param json JSON object representing the transaction
 * @param signer string representing the account to sign the transaction with
 * @param customDefinitions Custom rippled types to use instead of the default. Used for sidechains and amendments.
 * @returns a hex string of the encoded transaction
 */
function encodeForSigning(
  json: object,
  customDefinitions: DefinitionContents = DEFINITIONS,
): string {
  assert.ok(typeof json === 'object')
  return signingData(
    json as JsonObject,
    HashPrefix.transactionSig,
    customDefinitions,
  )
    .toString('hex')
    .toUpperCase()
}

/**
 * Encode a transaction and prepare for signing with a claim
 *
 * @param json JSON object representing the transaction
 * @param signer string representing the account to sign the transaction with
 * @param customDefinitions Custom rippled types to use instead of the default. Used for sidechains and amendments.
 * @returns a hex string of the encoded transaction
 */
function encodeForSigningClaim(
  json: object,
  customDefinitions: DefinitionContents = DEFINITIONS,
): string {
  assert.ok(typeof json === 'object')
  return signingClaimData(json as ClaimObject, customDefinitions)
    .toString('hex')
    .toUpperCase()
}

/**
 * Encode a transaction and prepare for multi-signing
 *
 * @param json JSON object representing the transaction
 * @param signer string representing the account to sign the transaction with
 * @param customDefinitions Custom rippled types to use instead of the default. Used for sidechains and amendments.
 * @returns a hex string of the encoded transaction
 */
function encodeForMultisigning(
  json: object,
  signer: string,
  customDefinitions: DefinitionContents = DEFINITIONS,
): string {
  assert.ok(typeof json === 'object')
  assert.equal(json['SigningPubKey'], '')
  return multiSigningData(json as JsonObject, signer, customDefinitions)
    .toString('hex')
    .toUpperCase()
}

/**
 * Encode a quality value
 *
 * @param value string representation of a number
 * @returns a hex-string representing the quality
 */
function encodeQuality(value: string): string {
  assert.ok(typeof value === 'string')
  return quality.encode(value).toString('hex').toUpperCase()
}

/**
 * Decode a quality value
 *
 * @param value hex-string of a quality
 * @returns a string representing the quality
 */
function decodeQuality(value: string): string {
  assert.ok(typeof value === 'string')
  return quality.decode(value).toString()
}

export = {
  decode,
  encode,
  encodeForSigning,
  encodeForSigningClaim,
  encodeForMultisigning,
  encodeQuality,
  decodeQuality,
  decodeLedgerData,
  TRANSACTION_TYPES,
}
