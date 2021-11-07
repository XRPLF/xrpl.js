import * as assert from "assert";
import { quality, binary } from "./coretypes";
import { decodeLedgerData } from "./ledger-hashes";
import { ClaimObject } from "./binary";
import { JsonObject } from "./types/serialized-type";
const {
  signingData,
  signingClaimData,
  multiSigningData,
  binaryToJSON,
  serializeObject,
} = binary;

/**
 * Decode a transaction
 *
 * @param binary hex-string of the encoded transaction
 * @returns the JSON representation of the transaction
 */
function decode(binary: string): JsonObject {
  assert.ok(typeof binary === "string", "binary must be a hex string");
  return binaryToJSON(binary);
}

/**
 * Encode a transaction
 *
 * @param json The JSON representation of a transaction
 * @returns A hex-string of the encoded transaction
 */
function encode(json: object): string {
  assert.ok(typeof json === "object");
  return serializeObject(json as JsonObject)
    .toString("hex")
    .toUpperCase();
}

/**
 * Encode a transaction and prepare for signing
 *
 * @param json JSON object representing the transaction
 * @param signer string representing the account to sign the transaction with
 * @returns a hex string of the encoded transaction
 */
function encodeForSigning(json: object): string {
  assert.ok(typeof json === "object");
  return signingData(json as JsonObject)
    .toString("hex")
    .toUpperCase();
}

/**
 * Encode a transaction and prepare for signing with a claim
 *
 * @param json JSON object representing the transaction
 * @param signer string representing the account to sign the transaction with
 * @returns a hex string of the encoded transaction
 */
function encodeForSigningClaim(json: object): string {
  assert.ok(typeof json === "object");
  return signingClaimData(json as ClaimObject)
    .toString("hex")
    .toUpperCase();
}

/**
 * Encode a transaction and prepare for multi-signing
 *
 * @param json JSON object representing the transaction
 * @param signer string representing the account to sign the transaction with
 * @returns a hex string of the encoded transaction
 */
function encodeForMultisigning(json: object, signer: string): string {
  assert.ok(typeof json === "object");
  assert.equal(json["SigningPubKey"], "");
  return multiSigningData(json as JsonObject, signer)
    .toString("hex")
    .toUpperCase();
}

/**
 * Encode a quality value
 *
 * @param value string representation of a number
 * @returns a hex-string representing the quality
 */
function encodeQuality(value: string): string {
  assert.ok(typeof value === "string");
  return quality.encode(value).toString("hex").toUpperCase();
}

/**
 * Decode a quality value
 *
 * @param value hex-string of a quality
 * @returns a string representing the quality
 */
function decodeQuality(value: string): string {
  assert.ok(typeof value === "string");
  return quality.decode(value).toString();
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
};
