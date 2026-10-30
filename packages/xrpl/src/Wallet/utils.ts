import { bytesToHex } from '@xrplf/isomorphic/utils'
import BigNumber from 'bignumber.js'
import {
  decodeAccountID,
  isValidXAddress,
  xAddressToClassicAddress,
} from 'ripple-address-codec'
import {
  decode,
  encode,
  encodeForMultisigning,
  encodeForMultisigningCounterparty,
  encodeForMultisigningSponsor,
  encodeForSigning,
  encodeForSigningCounterparty,
  encodeForSigningSponsor,
} from 'ripple-binary-codec'
import { sign } from 'ripple-keypairs'

import { ValidationError } from '../errors'
import { Transaction } from '../models'

/**
 * If presented in binary form, the Signers array must be sorted based on
 * the numeric value of the signer addresses, with the lowest value first.
 * (If submitted as JSON, the submit_multisigned method handles this automatically.)
 * https://xrpl.org/multi-signing.html.
 *
 * @param left - A Signer to compare with.
 * @param right - A second Signer to compare with.
 * @returns 1 if left \> right, 0 if left = right, -1 if left \< right.
 * @throws Error if either Account is null, undefined, or invalid.
 */
export function compareSigners<T extends { Account: string }>(
  left: T,
  right: T,
): number {
  if (!left.Account || !right.Account) {
    throw new Error('compareSigners: Account cannot be null or undefined')
  }
  const result = addressToBigNumber(left.Account).comparedTo(
    addressToBigNumber(right.Account),
  )
  if (result === null) {
    throw new Error(
      'compareSigners: Invalid account address comparison resulted in NaN',
    )
  }
  return result
}

export const NUM_BITS_IN_HEX = 16

/**
 * Converts an address to a BigNumber.
 *
 * @param address - The address to convert.
 * @returns A BigNumber representing the address.
 */
export function addressToBigNumber(address: string): BigNumber {
  const hex = bytesToHex(decodeAccountID(address))
  return new BigNumber(hex, NUM_BITS_IN_HEX)
}

/**
 * Decodes a transaction or transaction blob into a Transaction object.
 *
 * @param txOrBlob - A Transaction object or a hex string representing a transaction blob.
 * @returns A Transaction object.
 * @throws If the input is not a valid Transaction or transaction blob.
 */
export function getDecodedTransaction(
  txOrBlob: Transaction | string,
): Transaction {
  if (typeof txOrBlob === 'object') {
    // We need this to handle X-addresses in multisigning
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- We are casting here to get strong typing
    return decode(encode(txOrBlob)) as unknown as Transaction
  }

  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- We are casting here to get strong typing
  return decode(txOrBlob) as unknown as Transaction
}

/**
 * The role a signature plays on a transaction. Under `fixCleanup3_4_0` each role
 * covers a distinct signing prefix so a signature cannot be replayed in another
 * role (see rippled `signingPrefix`).
 */
export type SignatureRole = 'transaction' | 'counterparty' | 'sponsor'

const SIGNING_ENCODERS: Record<
  SignatureRole,
  {
    single: (tx: Transaction) => string
    multi: (tx: Transaction, signAs: string) => string
  }
> = {
  transaction: {
    single: (tx) => encodeForSigning(tx),
    multi: (tx, signAs) => encodeForMultisigning(tx, signAs),
  },
  counterparty: {
    single: (tx) => encodeForSigningCounterparty(tx),
    multi: (tx, signAs) => encodeForMultisigningCounterparty(tx, signAs),
  },
  sponsor: {
    single: (tx) => encodeForSigningSponsor(tx),
    multi: (tx, signAs) => encodeForMultisigningSponsor(tx, signAs),
  },
}

/**
 * Signs a transaction with the proper signing encoding.
 *
 * @param tx - A transaction to sign.
 * @param privateKey - A key to sign the transaction with.
 * @param signAs - Multisign only. An account address to include in the Signer field.
 * Can be either a classic address or an XAddress.
 * @param role - Which signature role to sign for. Defaults to `transaction`.
 * `counterparty` / `sponsor` use their `fixCleanup3_4_0` signing prefixes.
 * @returns A signed transaction in the proper format.
 */
// eslint-disable-next-line max-params -- role selects the fixCleanup3_4_0 signing prefix
export function computeSignature(
  tx: Transaction,
  privateKey: string,
  signAs?: string,
  role: SignatureRole = 'transaction',
): string {
  const encoders = SIGNING_ENCODERS[role]
  if (signAs) {
    const classicAddress = isValidXAddress(signAs)
      ? xAddressToClassicAddress(signAs).classicAddress
      : signAs

    return sign(encoders.multi(tx, classicAddress), privateKey)
  }
  return sign(encoders.single(tx), privateKey)
}

const ENTROPY_LENGTH_BYTES = 16
const MAX_BYTE_VALUE = 255

/**
 * Checks whether a value is a Uint8Array, including subclasses such as Buffer
 * and instances created in another realm (iframe, worker, vm context), which
 * fail a plain `instanceof` check.
 *
 * @param value - The value to test.
 * @returns Whether the value is a Uint8Array.
 */
export function isUint8Array(value: unknown): value is Uint8Array {
  return (
    value instanceof Uint8Array ||
    // The tag check alone would also admit other single-byte views, so
    // require the element size too.
    (ArrayBuffer.isView(value) &&
      'BYTES_PER_ELEMENT' in value &&
      value.BYTES_PER_ELEMENT === 1 &&
      Object.prototype.toString.call(value) === '[object Uint8Array]')
  )
}

/**
 * Builds the error for entropy of the wrong length.
 *
 * @param received - The number of bytes the caller supplied.
 * @returns The error to throw.
 */
function entropyLengthError(received: number): ValidationError {
  return new ValidationError(
    `entropy must be exactly ${ENTROPY_LENGTH_BYTES} bytes, received ${received}. ` +
      `A seed holds ${ENTROPY_LENGTH_BYTES} bytes, so extra bytes cannot be stored. ` +
      `If all of your input is meaningful, hash it down to ${ENTROPY_LENGTH_BYTES} ` +
      `bytes rather than truncating, which would discard the difference between ` +
      `inputs that share their first ${ENTROPY_LENGTH_BYTES} bytes.`,
  )
}

/**
 * Converts caller-supplied entropy into exactly ENTROPY_LENGTH_BYTES bytes.
 *
 * Only a Uint8Array or an array of byte values is accepted; anything else is
 * rejected rather than coerced. The caller's input is read once and validated
 * as read, so the bytes checked here are always the bytes returned.
 *
 * @param entropy - Caller-supplied entropy.
 * @returns The entropy as a byte array of exactly ENTROPY_LENGTH_BYTES bytes.
 * @throws ValidationError if entropy is not exactly ENTROPY_LENGTH_BYTES bytes
 * of byte-valued data.
 */
export function validateEntropy(entropy: Uint8Array | number[]): Uint8Array {
  if (isUint8Array(entropy)) {
    // Copy via the constructor, which uses the source's internal length. A
    // `length` or @@iterator defined on the source cannot affect the result.
    const bytes = new Uint8Array(entropy)
    if (bytes.length !== ENTROPY_LENGTH_BYTES) {
      throw entropyLengthError(bytes.length)
    }
    return bytes
  }

  if (!Array.isArray(entropy)) {
    throw new ValidationError(
      `entropy must be a Uint8Array or an array of byte values, received ${typeof entropy}. ` +
        `If you have a hex string, convert it to bytes first (for example with hexToBytes) ` +
        `rather than passing the string directly.`,
    )
  }

  if (entropy.length !== ENTROPY_LENGTH_BYTES) {
    throw entropyLengthError(entropy.length)
  }

  // Read by index, not by iteration: indexed reads are bounded and reflect
  // what the array holds. Holes read back as `undefined` and are rejected by
  // the byte check below.
  const values = Array.from(
    { length: ENTROPY_LENGTH_BYTES },
    (_unused, index) => entropy[index],
  )

  if (
    !values.every(
      (byte) => Number.isInteger(byte) && byte >= 0 && byte <= MAX_BYTE_VALUE,
    )
  ) {
    throw new ValidationError(
      `entropy must contain only integers between 0 and ${MAX_BYTE_VALUE}, ` +
        `with no missing or empty positions.`,
    )
  }

  return Uint8Array.from(values)
}
