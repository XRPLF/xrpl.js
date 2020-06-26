import { strict as assert } from "assert";
import { quality, binary } from "./coretypes";
import { coreTypes } from "./types";
const {
  bytesToHex,
  signingData,
  signingClaimData,
  multiSigningData,
  binaryToJSON,
  serializeObject,
  BinaryParser,
} = binary;

function decodeLedgerData(binary) {
  assert(typeof binary === "string", "binary must be a hex string");
  const parser = new BinaryParser(binary);
  return {
    ledger_index: parser.readUInt32(),
    total_coins: parser.readType(coreTypes.UInt64).valueOf().toString(),
    parent_hash: parser.readType(coreTypes.Hash256).toHex(),
    transaction_hash: parser.readType(coreTypes.Hash256).toHex(),
    account_hash: parser.readType(coreTypes.Hash256).toHex(),
    parent_close_time: parser.readUInt32(),
    close_time: parser.readUInt32(),
    close_time_resolution: parser.readUInt8(),
    close_flags: parser.readUInt8(),
  };
}

function decode(binary) {
  assert(typeof binary === "string", "binary must be a hex string");
  return binaryToJSON(binary);
}

function encode(json) {
  assert(typeof json === "object");
  return bytesToHex(serializeObject(json));
}

function encodeForSigning(json) {
  assert(typeof json === "object");
  return bytesToHex(signingData(json));
}

function encodeForSigningClaim(json) {
  assert(typeof json === "object");
  return bytesToHex(signingClaimData(json));
}

function encodeForMultisigning(json, signer) {
  assert(typeof json === "object");
  assert.equal(json.SigningPubKey, "");
  return bytesToHex(multiSigningData(json, signer));
}

function encodeQuality(value) {
  assert(typeof value === "string");
  return bytesToHex(quality.encode(value));
}

function decodeQuality(value) {
  assert(typeof value === "string");
  return quality.decode(value).toString();
}

module.exports = {
  decode,
  encode,
  encodeForSigning,
  encodeForSigningClaim,
  encodeForMultisigning,
  encodeQuality,
  decodeQuality,
  decodeLedgerData,
};
