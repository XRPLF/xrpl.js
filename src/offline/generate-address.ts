import keypairs = require('ripple-keypairs')
import * as common from '../common'
const {errors, validate} = common

function generateAddress(options?: object): object {
  const secret = keypairs.generateSeed(options)
  const keypair = keypairs.deriveKeypair(secret)
  const address = keypairs.deriveAddress(keypair.publicKey)
  return {secret, address}
}

function generateAddressAPI(options?: object): object {
  validate.generateAddress({options})
  try {
    return generateAddress(options)
  } catch (error) {
    throw new errors.UnexpectedError(error.message)
  }
}

export {
  generateAddressAPI
}
