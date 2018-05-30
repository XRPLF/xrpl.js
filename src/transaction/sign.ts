import * as utils from './utils'
import keypairs = require('ripple-keypairs')
import binary = require('ripple-binary-codec')
import {computeBinaryTransactionHash} from 'ripple-hashes'
import {SignOptions, KeyPair} from './types'
import {BigNumber} from 'bignumber.js'
const validate = utils.common.validate

function computeSignature(tx: Object, privateKey: string, signAs?: string) {
  const signingData = signAs
    ? binary.encodeForMultisigning(tx, signAs)
    : binary.encodeForSigning(tx)
  return keypairs.sign(signingData, privateKey)
}

function signWithKeypair(
  txJSON: string,
  keypair: KeyPair,
  options: SignOptions = {
    signAs: ''
  }
): { signedTransaction: string; id: string } {
  validate.sign({txJSON, keypair})

  const tx = JSON.parse(txJSON)
  if (tx.TxnSignature || tx.Signers) {
    throw new utils.common.errors.ValidationError(
      'txJSON must not contain "TxnSignature" or "Signers" properties'
    )
  }
  if (options.allowHighFee !== true) {
    const fee = new BigNumber(tx.Fee)
    if (fee.greaterThan('2000000')) {
      throw new utils.common.errors.ValidationError(
        '"Fee" should not exceed "2000000". ' +
        'To use a high fee, set `options.allowHighFee = true`.'
      )
    }
  }

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

function sign(
  txJSON: string,
  secret?: any,
  options?: SignOptions,
  keypair?: KeyPair
): { signedTransaction: string; id: string } {
  if (typeof secret === 'string') {
    // we can't validate that the secret matches the account because
    // the secret could correspond to the regular key
    validate.sign({txJSON, secret})
    return signWithKeypair(txJSON, keypairs.deriveKeypair(secret), options)
  } else {
    return signWithKeypair(txJSON, keypair ? keypair : secret, options)
  }
}

export default sign
