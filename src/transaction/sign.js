/* @flow */
'use strict' // eslint-disable-line strict
const utils = require('./utils')
const keypairs = require('ripple-keypairs')
const binary = require('ripple-binary-codec')
const {computeBinaryTransactionHash} = require('ripple-hashes')
const validate = utils.common.validate

function computeSignature(tx: Object, privateKey: string, signAs: ?string) {
  const signingData = signAs ?
    binary.encodeForMultisigning(tx, signAs) : binary.encodeForSigning(tx)
  return keypairs.sign(signingData, privateKey)
}

function sign(txJSON: string, secret: string, options: Object = {}
): {signedTransaction: string; id: string} {
  validate.sign({txJSON, secret})
  // we can't validate that the secret matches the account because
  // the secret could correspond to the regular key

  const tx = JSON.parse(txJSON)
  if (tx.TxnSignature || tx.Signers) {
    throw new utils.common.errors.ValidationError(
      'txJSON must not contain "TxnSignature" or "Signers" properties')
  }

  const keypair = keypairs.deriveKeypair(secret)
  tx.SigningPubKey = options.signAs ? '' : keypair.publicKey

  if (options.signAs) {
    const signer = {
      Account: options.signAs,
      SigningPubKey: keypair.publicKey,
      TxnSignature: computeSignature(tx, keypair.privateKey, options.signAs)
    }
    tx.Signers = [{Signer: signer}]
  } else {
    tx.TxnSignature = computeSignature(tx, keypair.privateKey)
  }

  const serialized = binary.encode(tx)
  return {
    signedTransaction: serialized,
    id: computeBinaryTransactionHash(serialized)
  }
}

module.exports = sign
