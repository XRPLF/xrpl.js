'use strict' // eslint-disable-line strict
const keypairs = require('ripple-keypairs')
const common = require('../common')
const {errors, validate} = common

function generateAddress(options?: Object): Object {
  const secret = keypairs.generateSeed(options)
  const keypair = keypairs.deriveKeypair(secret)
  const address = keypairs.deriveAddress(keypair.publicKey)
  return {secret, address}
}

function generateAddressAPI(options?: Object): Object {
  validate.generateAddress({options})
  try {
    return generateAddress(options)
  } catch (error) {
    throw new errors.UnexpectedError(error.message)
  }
}

module.exports = {
  generateAddressAPI
}
