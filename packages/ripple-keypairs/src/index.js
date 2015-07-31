'use strict';

const assert = require('assert');
const codec = require('ripple-address-codec');
const rand = require('brorand');

const {seedFromPhrase, createAccountID} = require('./utils');
const {KeyPair, KeyType} = require('./keypair');
const {Ed25519Pair} = require('./ed25519');
const {K256Pair, accountPublicFromGenerator} = require('./secp256k1');

KeyPair.fromSeed = function(seedBytes, type, options) {
  assert(type === 'secp256k1' || type === 'ed25519');
  const Pair = type === 'ed25519' ? Ed25519Pair : K256Pair;
  return Pair.fromSeed(seedBytes, options);
};

function keyPairFromSeed(seedString, options) {
  const decoded = codec.decodeSeed(seedString);
  return KeyPair.fromSeed(decoded.bytes, decoded.type, options);
}

function deriveWallet(type, seedBytes) {
  const pair = KeyPair.fromSeed(seedBytes, type);

  return {
    seed: pair.seed(),
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
    seed: pair.seed(),
    publicKey: codec.encodeNodePublic(pair.pubKeyCanonicalBytes())
  };
}

function generateValidatorKeys(opts={}) {
  const {randGen=rand} = opts;
  return deriveValidator(randGen(16));
}

function nodePublicAccountID(publicKey) {
  const genBytes = codec.decodeNodePublic(publicKey);
  const accountPublicBytes = accountPublicFromGenerator(genBytes);
  return codec.encodeAccountID(createAccountID(accountPublicBytes));
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
  validatorKeysFromSeed,
  nodePublicAccountID
};
