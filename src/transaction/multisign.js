/* @flow */
'use strict';
const utils = require('./utils');
const keypairs = require('ripple-keypairs');
const addressCodec = require('ripple-address-codec');
const binary = require('ripple-binary-codec');
const {computeBinaryTransactionHash} = require('ripple-hashes');
const validate = utils.common.validate;

function computeSignature(txJSON, privateKey) {
  const signingData = binary.encodeForMultisigning(txJSON);
  return keypairs.sign(signingData, privateKey);
}

function prepareSigner(txJSON: string, secret: string) {
  validate.sign({txJSON, secret});

  const tx = Object.assign(JSON.parse(txJSON), {SigningPubKey: ''});
  const keypair = keypairs.deriveKeypair(secret);

  return {
    Account: keypairs.deriveAddress(keypair.publicKey),
    SigningPubKey: keypair.publicKey,
    TxnSignature: computeSignature(tx, keypair.privateKey)
  };
}

function addSigner(txJSON: string, signer) {
  const tx = JSON.parse(txJSON);

  if (tx.Signers === undefined) {
    tx.Signers = [];
  }

  tx.Signers.concat({Signer: signer}).sort((a, b) => {
    return Buffer(addressCodec.decodeAddress(a.Account))
    .compare(Buffer(addressCodec.decodeAddress(b.Account)))
  });

  return JSON.stringify(tx);
}

module.exports = {prepareSigner, addSigner};
