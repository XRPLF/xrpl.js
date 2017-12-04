/* @flow */

import keypairs from 'ripple-keypairs'
import * as common from '../common'
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

export {
  generateAddressAPI
}
