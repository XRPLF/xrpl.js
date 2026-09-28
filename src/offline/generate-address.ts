import {classicAddressToXAddress} from 'ripple-address-codec'
import keypairs from 'ripple-keypairs'
import {errors, validate} from '../common'

export type GeneratedAddress = {
  xAddress: string
  classicAddress?: string
  address?: string // @deprecated Use `classicAddress` instead.
  secret: string
}

export interface GenerateAddressOptions {
  // The entropy to use to generate the seed.
  entropy?: Uint8Array | number[]

  // The digital signature algorithm to generate an address for. Can be `ecdsa-secp256k1` (default) or `ed25519`.
  algorithm?: 'ecdsa-secp256k1' | 'ed25519'

  // Specifies whether the address is intended for use on a test network such as Testnet or Devnet.
  // If `true`, the address should only be used for testing, and will start with `T`.
  // If `false` (default), the address should only be used on mainnet, and will start with `X`.
  test?: boolean

  // If `true`, return the classic address, in addition to the X-address.
  includeClassicAddress?: boolean
}

const ENTROPY_LENGTH_BYTES = 16
const MAX_BYTE_VALUE = 255

/**
 * Converts caller-supplied entropy into exactly ENTROPY_LENGTH_BYTES bytes.
 *
 * The JSON schema already bounds the length and the value of each element it
 * sees, but it skips holes: `new Array(16)` reports a length of 16 and passes
 * validation, then reads back as 16 zero bytes. Reading by index here turns
 * those holes into `undefined`, which the byte check rejects.
 */
function validateEntropy(entropy: Uint8Array | number[]): Uint8Array {
  const values = Array.from(
    {length: ENTROPY_LENGTH_BYTES},
    (_unused, index) => entropy[index]
  )
  if (
    !values.every(
      (byte) => Number.isInteger(byte) && byte >= 0 && byte <= MAX_BYTE_VALUE
    )
  ) {
    throw new errors.ValidationError(
      `entropy must contain only integers between 0 and ${MAX_BYTE_VALUE}, ` +
        `with no missing or empty positions.`
    )
  }
  return Uint8Array.from(values)
}

function generateAddressAPI(options: GenerateAddressOptions = {}): GeneratedAddress {
  validate.generateAddress({options})
  // Validated outside the try below, so that a ValidationError reaches the
  // caller as a ValidationError rather than being rewrapped.
  const entropy =
    options.entropy === undefined ? undefined : validateEntropy(options.entropy)
  try {
    const generateSeedOptions: {
      entropy?: Uint8Array
      algorithm?: 'ecdsa-secp256k1' | 'ed25519'
    } = {
      algorithm: options.algorithm
    }
    if (entropy) {
      generateSeedOptions.entropy = entropy
    }
    const secret = keypairs.generateSeed(generateSeedOptions)
    const keypair = keypairs.deriveKeypair(secret)
    const classicAddress = keypairs.deriveAddress(keypair.publicKey)
    const returnValue: any = {
      xAddress: classicAddressToXAddress(
        classicAddress,
        false,
        options && options.test
      ),
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

export {generateAddressAPI}
