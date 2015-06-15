/* @flow */
'use strict';
const utils = require('./utils');
const ripple = utils.common.core;
const validate = utils.common.validate;

/**
 * These prefixes are inserted before the source material used to
 * generate various hashes. This is done to put each hash in its own
 * "space." This way, two different types of objects with the
 * same binary data will produce different hashes.
 *
 * Each prefix is a 4-byte value with the last byte set to zero
 * and the first three bytes formed from the ASCII equivalent of
 * some arbitrary string. For example "TXN".
 */
const HASH_TX_ID = 0x54584E00; // 'TXN'
const HASH_TX_SIGN = 0x53545800; // 'STX'
const HASH_TX_SIGN_TESTNET = 0x73747800; // 'stx'

function getKeyPair(address, secret) {
  return ripple.Seed.from_json(secret).get_key(address);
}

function getPublicKeyHex(keypair) {
  return keypair.to_hex_pub();
}

function serialize(txJSON) {
  return ripple.SerializedObject.from_json(txJSON);
}

function hashSerialization(serialized, prefix) {
  return serialized.hash(prefix || HASH_TX_ID).to_hex();
}

function hashJSON(txJSON, prefix) {
  return hashSerialization(serialize(txJSON), prefix);
}

function signingHash(txJSON, isTestNet=false) {
  return hashJSON(txJSON, isTestNet ? HASH_TX_SIGN_TESTNET : HASH_TX_SIGN);
}

function computeSignature(txJSON, keypair) {
  const signature = keypair.sign(signingHash(txJSON));
  return ripple.sjcl.codec.hex.fromBits(signature).toUpperCase();
}

/*:: type TxJSON = {Account: string; SigningPubKey: string,
                    TxnSignature: string};
     type Signed = {signedTransaction: string; id: string}; */
function sign(txJSON: TxJSON, secret: string): Signed {
  validate.txJSON(txJSON);
  validate.addressAndSecret({address: txJSON.Account, secret: secret});

  const keypair = getKeyPair(txJSON.Account, secret);
  if (txJSON.SigningPubKey === undefined) {
    txJSON.SigningPubKey = getPublicKeyHex(keypair);
  }
  txJSON.TxnSignature = computeSignature(txJSON, keypair);
  const serialized = serialize(txJSON);
  return {
    signedTransaction: serialized.to_hex(),
    id: hashSerialization(serialized, HASH_TX_ID)
  };
}

module.exports = sign;
