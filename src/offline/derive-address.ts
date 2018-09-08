import keypairs = require('ripple-keypairs')
import * as common from '../common'
const {errors, validate} = common

function deriveAddress(secret: string): Object {
  const keypair = keypairs.deriveKeypair(secret)
  const address = keypairs.deriveAddress(keypair.publicKey)
  return {secret, address}
}

function deriveAddressAPI(secret): Object {
  validate.deriveAddress({secret})
  try {
    return deriveAddress(secret)
  } catch (error) {
    throw new errors.UnexpectedError(error.message)
  }
}

export {
  deriveAddressAPI
}
