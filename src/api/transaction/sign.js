/* @flow */
'use strict';
const utils = require('./utils');
const keypairs = require('ripple-keypairs');
const binary = require('ripple-binary-codec');
const sha512 = require('hash.js').sha512;
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

// For a hash function, rippled uses SHA-512 and then truncates the result
// to the first 256 bytes. This algorithm, informally called SHA-512Half,
// provides an output that has comparable security to SHA-256, but runs
// faster on 64-bit processors.
function sha512half(buffer) {
  return sha512().update(buffer).digest('hex').toUpperCase().slice(0, 64);
}

function hashSerialization(serialized, prefix) {
  const hexPrefix = prefix.toString(16).toUpperCase();
  return sha512half(new Buffer(hexPrefix + serialized, 'hex'));
}

function computeSignature(txJSON, privateKey) {
  const signingData = binary.encodeForSigning(txJSON);
  return keypairs.sign(new Buffer(signingData, 'hex'), privateKey);
}

function sign(txJSON: string, secret: string
): {signedTransaction: string; id: string} {
  const tx = JSON.parse(txJSON);
  validate.txJSON(tx);
  validate.secret(secret);

  const keypair = keypairs.deriveKeypair(secret);
  if (tx.SigningPubKey === undefined) {
    tx.SigningPubKey = keypair.publicKey;
  }
  tx.TxnSignature = computeSignature(tx, keypair.privateKey);
  const serialized = binary.encode(tx);
  return {
    signedTransaction: serialized,
    id: hashSerialization(serialized, HASH_TX_ID)
  };
}

module.exports = sign;
