import { classicAddressToXAddress } from 'ripple-address-codec'
import keypairs from 'ripple-keypairs'

import { errors } from '../common'
import ECDSA from '../common/ecdsa'

export interface GeneratedAddress {
  xAddress: string
  classicAddress?: string
  address?: string // @deprecated Use `classicAddress` instead.
  secret: string
}

export interface GenerateAddressOptions {
  // The entropy to use to generate the seed.
  entropy?: Uint8Array | number[]

  // The digital signature algorithm to generate an address for. Can be `ecdsa-secp256k1` (default) or `ed25519`.
  algorithm?: ECDSA

  // Specifies whether the address is intended for use on a test network such as Testnet or Devnet.
  // If `true`, the address should only be used for testing, and will start with `T`.
  // If `false` (default), the address should only be used on mainnet, and will start with `X`.
  test?: boolean

  // If `true`, return the classic address, in addition to the X-address.
  includeClassicAddress?: boolean
}

// TODO: move this function to be a static function of the Wallet class (Along with its helper data types)
function generateXAddress(
  options: GenerateAddressOptions = {},
): GeneratedAddress {
  try {
    const generateSeedOptions: {
      entropy?: Uint8Array
      algorithm?: ECDSA
    } = {
      algorithm: options.algorithm,
    }
    if (options.entropy) {
      generateSeedOptions.entropy = Uint8Array.from(options.entropy)
    }
    const secret = keypairs.generateSeed(generateSeedOptions)
    const keypair = keypairs.deriveKeypair(secret)
    const classicAddress = keypairs.deriveAddress(keypair.publicKey)
    const returnValue: any = {
      xAddress: classicAddressToXAddress(
        classicAddress,
        false,
        options.test ?? false,
      ),
      secret,
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

export { generateXAddress }
