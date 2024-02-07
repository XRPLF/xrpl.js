import { quality, binary, HashPrefix } from './coretypes'
import { decodeLedgerData } from './ledger-hashes'
import { ClaimObject } from './binary'
import { JsonObject } from './types/serialized-type'
import {
  XrplDefinitionsBase,
  TRANSACTION_TYPES,
  DEFAULT_DEFINITIONS,
} from './enums'
import { XrplDefinitions } from './enums/xrpl-definitions'
import { coreTypes } from './types'
import { bytesToHex } from '@xrplf/isomorphic/utils'

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
 * @param definitions Custom rippled types to use instead of the default. Used for sidechains and amendments.
 * @returns the JSON representation of the transaction
 */
function decode(binary: string, definitions?: XrplDefinitionsBase): JsonObject {
  if (typeof binary !== 'string') {
    throw new Error('binary must be a hex string')
  }
  return binaryToJSON(binary, definitions)
}

/**
 * Encode a transaction
 *
 * @param json The JSON representation of a transaction
 * @param definitions Custom rippled types to use instead of the default. Used for sidechains and amendments.
 *
 * @returns A hex-string of the encoded transaction
 */
function encode(json: object, definitions?: XrplDefinitionsBase): string {
  if (typeof json !== 'object') {
    throw new Error()
  }
  return bytesToHex(serializeObject(json as JsonObject, { definitions }))
}

/**
 * Encode a transaction and prepare for signing
 *
 * @param json JSON object representing the transaction
 * @param signer string representing the account to sign the transaction with
 * @param definitions Custom rippled types to use instead of the default. Used for sidechains and amendments.
 * @returns a hex string of the encoded transaction
 */
function encodeForSigning(
  json: object,
  definitions?: XrplDefinitionsBase,
): string {
  if (typeof json !== 'object') {
    throw new Error()
  }
  return bytesToHex(
    signingData(json as JsonObject, HashPrefix.transactionSig, {
      definitions,
    }),
  )
}

/**
 * Encode a transaction and prepare for signing with a claim
 *
 * @param json JSON object representing the transaction
 * @param signer string representing the account to sign the transaction with
 * @param definitions Custom rippled types to use instead of the default. Used for sidechains and amendments.
 * @returns a hex string of the encoded transaction
 */
function encodeForSigningClaim(json: object): string {
  if (typeof json !== 'object') {
    throw new Error()
  }
  return bytesToHex(signingClaimData(json as ClaimObject))
}

/**
 * Encode a transaction and prepare for multi-signing
 *
 * @param json JSON object representing the transaction
 * @param signer string representing the account to sign the transaction with
 * @param definitions Custom rippled types to use instead of the default. Used for sidechains and amendments.
 * @returns a hex string of the encoded transaction
 */
function encodeForMultisigning(
  json: object,
  signer: string,
  definitions?: XrplDefinitionsBase,
): string {
  if (typeof json !== 'object') {
    throw new Error()
  }
  if (json['SigningPubKey'] !== '') {
    throw new Error()
  }
  const definitionsOpt = definitions ? { definitions } : undefined
  return bytesToHex(
    multiSigningData(json as JsonObject, signer, definitionsOpt),
  )
}

/**
 * Encode a quality value
 *
 * @param value string representation of a number
 * @returns a hex-string representing the quality
 */
function encodeQuality(value: string): string {
  if (typeof value !== 'string') {
    throw new Error()
  }
  return bytesToHex(quality.encode(value))
}

/**
 * Decode a quality value
 *
 * @param value hex-string of a quality
 * @returns a string representing the quality
 */
function decodeQuality(value: string): string {
  if (typeof value !== 'string') {
    throw new Error()
  }
  return quality.decode(value).toString()
}

export {
  decode,
  encode,
  encodeForSigning,
  encodeForSigningClaim,
  encodeForMultisigning,
  encodeQuality,
  decodeQuality,
  decodeLedgerData,
  TRANSACTION_TYPES,
  XrplDefinitions,
  XrplDefinitionsBase,
  DEFAULT_DEFINITIONS,
  coreTypes,
}
