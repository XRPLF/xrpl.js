import keypairs from 'ripple-keypairs'
import * as common from '../common'
const {errors, validate} = common

export type GeneratedAddress = {
  secret: string,
  address: string
}

function generateAddressAPI(options?: any): GeneratedAddress {
  validate.generateAddress({options})
  try {
    const secret = keypairs.generateSeed(options)
    const keypair = keypairs.deriveKeypair(secret)
    const address = keypairs.deriveAddress(keypair.publicKey)
    return {secret, address}
  } catch (error) {
    throw new errors.UnexpectedError(error.message)
  }
}

export {
  generateAddressAPI
}
