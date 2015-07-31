'use strict';

/* -------------------------------- REQUIRES -------------------------------- */

const assert = require('assert');
const codec = require('ripple-address-codec');
const rand = require('brorand');

const {seedFromPhrase, createAccountID} = require('./utils');
const {KeyPair, KeyType} = require('./keypair');
const Ed25519Pair = require('./ed25519');
const K256Pair = require('./secp256k1');

function keyPairFromSeed(seedString, options) {
  const decoded = codec.decodeSeed(seedString);
  const Pair = decoded.type === 'ed25519' ? Ed25519Pair : K256Pair;
  return Pair.fromSeed(decoded.bytes, options);
}

function deriveWallet(type, seedBytes) {
  assert(type === 'secp256k1' || type === 'ed25519');

  let pair;
  let seed;

  if (type === 'secp256k1') {
    seed = codec.encodeK256Seed(seedBytes);
    pair = K256Pair.fromSeed(seedBytes);
  } else {
    seed = codec.encodeEdSeed(seedBytes);
    pair = Ed25519Pair.fromSeed(seedBytes);
  }

  return {
    seed,
    accountID: pair.accountID(),
    publicKey: pair.pubKeyHex()
  };
}

function generateWallet(opts={}) {
  const {type='secp256k1', randGen=rand} = opts;
  const seedBytes = randGen(16);
  return deriveWallet(type, seedBytes);
}

function walletFromSeed(seed) {
  const {type, bytes} = codec.decodeSeed(seed);
  return deriveWallet(type, bytes);
}

function deriveValidator(seedBytes) {
  const pair = K256Pair.fromSeed(seedBytes, {validator: true});
  return {
    seed: codec.encodeK256Seed(seedBytes),
    publicKey: codec.encodeNodePublic(pair.pubKeyCanonicalBytes())
  };
}

function generateValidatorKeys(opts={}) {
  const {randGen=rand} = opts;
  return deriveValidator(randGen(16));
}

function validatorKeysFromSeed(seed) {
  const {type, bytes} = codec.decodeSeed(seed);
  assert(type === KeyType.secp256k1);
  return deriveValidator(bytes);
}

module.exports = {
  KeyPair,
  K256Pair,
  Ed25519Pair,
  KeyType,
  seedFromPhrase,
  createAccountID,
  keyPairFromSeed,
  generateWallet,
  generateValidatorKeys,
  walletFromSeed,
  validatorKeysFromSeed
};
