import { ValidationError } from '../errors'

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
