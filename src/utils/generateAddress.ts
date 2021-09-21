import { classicAddressToXAddress } from 'ripple-address-codec'
import keypairs from 'ripple-keypairs'

import ECDSA from '../ecdsa'
import { UnexpectedError } from '../errors'

export interface GeneratedAddress {
  xAddress: string
  classicAddress?: string
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

/**
 * TODO: Move this function to be a static function of the Wallet Class.
 * TODO: Doc this function.
 *
 * @param options - Options for generating X-Address.
 * @returns A generated address.
 * @throws When cannot generate an address.
 */
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
    const returnValue: GeneratedAddress = {
      xAddress: classicAddressToXAddress(
        classicAddress,
        false,
        options.test ?? false,
      ),
      secret,
    }
    if (options.includeClassicAddress) {
      returnValue.classicAddress = classicAddress
    }
    return returnValue
  } catch (error) {
    if (error instanceof Error) {
      throw new UnexpectedError(error.message)
    }

    throw error
  }
}

export { generateXAddress }
