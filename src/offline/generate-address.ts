import {classicAddressToXAddress} from 'ripple-address-codec'
import keypairs from 'ripple-keypairs'
import {errors, validate} from '../common'

export type GeneratedAddress = {
  xAddress: string,
  classicAddress?: string,
  address?: string, // @deprecated Use `classicAddress` instead.
  secret: string
}

export interface GenerateAddressOptions {
  // The entropy to use to generate the seed.
  entropy?: Uint8Array,

  // The digital signature algorithm to generate an address for. Can be `ecdsa-secp256k1` (default) or `ed25519`.
  algorithm?: 'ecdsa-secp256k1' | 'ed25519',

  // Specifies whether the address is intended for use on a test network such as Testnet or Devnet.
  // If `true`, the address should only be used for testing, and will start with `T`.
  // If `false` (default), the address should only be used on mainnet, and will start with `X`.
  test?: boolean,

  // If `true`, return the classic address, in addition to the X-address.
  includeClassicAddress?: boolean
}

function generateAddressAPI(options: GenerateAddressOptions): GeneratedAddress {
  validate.generateAddress({options})
  try {
    const secret = keypairs.generateSeed(options)
    const keypair = keypairs.deriveKeypair(secret)
    const classicAddress = keypairs.deriveAddress(keypair.publicKey)
    const returnValue: any = {
      xAddress: classicAddressToXAddress(classicAddress, false, options && options.test),
      secret
    }
    if (options.includeClassicAddress) {
      returnValue.classicAddress = classicAddress
      returnValue.address = classicAddress
    }
    return returnValue
  } catch (error) {
    throw new errors.UnexpectedError(error.message)
  }
}

export {
  generateAddressAPI
}
