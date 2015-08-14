'use strict';

const assert = require('assert');
const brorand = require('brorand');
const codec = require('ripple-address-codec');

const {seedFromPhrase, createAccountID} = require('./utils');
const {KeyPair, KeyType} = require('./keypair');
const {Ed25519Pair} = require('./ed25519');
const {K256Pair, accountPublicFromPublicGenerator} = require('./secp256k1');
const {decodeSeed, encodeNodePublic, decodeNodePublic, encodeAccountID} = codec;

function parseSeed(seed, type=KeyType.secp256k1) {
  if (typeof seed !== 'string') {
    return {bytes: seed, type};
  }
  return decodeSeed(seed);
}

KeyPair.fromSeed = function(seed, type=KeyType.secp256k1, options) {
  if (typeof seed === 'string') {
    const decoded = decodeSeed(seed);
    const optionsArg = type;
    return this.fromSeed(decoded.bytes, decoded.type, optionsArg);
  }

  assert(type === KeyType.secp256k1 || type === KeyType.ed25519);
  const Pair = type === 'ed25519' ? Ed25519Pair : K256Pair;
  return Pair.fromSeed(seed, options);
};

function deriveWallet(seedBytes, type) {
  const pair = KeyPair.fromSeed(seedBytes, type);

  return {
    seed: pair.seed(),
    accountID: pair.accountID(),
    publicKey: pair.pubKeyHex()
  };
}

function deriveValidator(seedBytes) {
  const pair = K256Pair.fromSeed(seedBytes, {validator: true});
  return {
    seed: pair.seed(),
    publicKey: encodeNodePublic(pair.pubKeyCanonicalBytes())
  };
}

function generateWallet(opts={}) {
  const {type='secp256k1', random=brorand} = opts;
  const seedBytes = random(16);
  return deriveWallet(seedBytes, type);
}

function walletFromSeed(seed, seedType) {
  const {type, bytes} = parseSeed(seed, seedType);
  return deriveWallet(bytes, type);
}

function walletFromPhrase(phrase, type) {
  return walletFromSeed(seedFromPhrase(phrase), type);
}

function generateValidatorKeys(opts={}) {
  const {random=brorand} = opts;
  return deriveValidator(random(16));
}

function nodePublicAccountID(publicKey) {
  const generatorBytes = decodeNodePublic(publicKey);
  const accountPublicBytes = accountPublicFromPublicGenerator(generatorBytes);
  return encodeAccountID(createAccountID(accountPublicBytes));
}

function validatorKeysFromSeed(seed, seedType) {
  const {type, bytes} = parseSeed(seed, seedType);
  assert(type === KeyType.secp256k1);
  return deriveValidator(bytes);
}

function validatorKeysFromPhrase(phrase) {
  return deriveValidator(seedFromPhrase(phrase));
}

function keyPairFromSeed(seedString, options) {
  return KeyPair.fromSeed(seedString, options);
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
  walletFromPhrase,
  validatorKeysFromSeed,
  validatorKeysFromPhrase,
  nodePublicAccountID
};
