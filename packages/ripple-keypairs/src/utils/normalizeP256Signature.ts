import { bytesToHex, hexToBytes } from '@xrplf/isomorphic/utils'

/** The order n of the P-256 group. */
const P256_ORDER = BigInt(
  '0xFFFFFFFF00000000FFFFFFFFFFFFFFFFBCE6FAADA7179E84F3B9CAC2FC632551',
)
const P256_HALF_ORDER = (P256_ORDER - BigInt(1)) / BigInt(2)

const DER_SEQUENCE = 0x30
const DER_INTEGER = 0x02
/** The largest DER length that fits the short form, which xrpld requires. */
const DER_MAX_SHORT_LENGTH = 0x7f
/** A byte at or above this has the DER sign bit set. */
const SIGN_BIT = 0x80
const HEX_RADIX = 16

const NOT_DER = 'normalizeP256Signature: not a DER ECDSA signature'

/**
 * Reads one DER INTEGER (short-form length) as a non-negative bigint.
 *
 * @param der - The signature bytes.
 * @param offset - The offset of the INTEGER's tag.
 * @returns The value and the offset just past it.
 * @throws When there is no well-formed non-negative INTEGER at the offset.
 */
function readInteger(der: Uint8Array, offset: number): [bigint, number] {
  if (offset + 2 > der.length) {
    throw new Error(NOT_DER)
  }
  const length = der[offset + 1]
  const end = offset + 2 + length
  if (
    der[offset] !== DER_INTEGER ||
    length === 0 ||
    length > DER_MAX_SHORT_LENGTH ||
    end > der.length ||
    der[offset + 2] >= SIGN_BIT
  ) {
    throw new Error(NOT_DER)
  }
  return [BigInt(`0x${bytesToHex(der.slice(offset + 2, end))}`), end]
}

/**
 * Encodes a positive bigint as a minimal DER INTEGER.
 *
 * @param value - The value.
 * @returns The INTEGER's tag, length and content.
 */
function encodeInteger(value: bigint): Uint8Array {
  let hex = value.toString(HEX_RADIX)
  if (hex.length % 2 === 1) {
    hex = `0${hex}`
  }
  const content = hexToBytes(hex)
  // A first byte with the high bit set would read as negative.
  const body = content[0] < SIGN_BIT ? content : [0, ...content]
  return Uint8Array.from([DER_INTEGER, body.length, ...body])
}

/**
 * Decodes the bytes of a DER `SEQUENCE { INTEGER r, INTEGER s }`.
 *
 * @param signature - The signature, as hex or bytes.
 * @returns r and s.
 * @throws When the value is not such a SEQUENCE.
 */
function decodeSignature(signature: string | Uint8Array): [bigint, bigint] {
  if (
    typeof signature === 'string' &&
    !/^(?:[\dA-Fa-f]{2})+$/u.test(signature)
  ) {
    throw new Error(NOT_DER)
  }
  const der = typeof signature === 'string' ? hexToBytes(signature) : signature
  if (der[0] !== DER_SEQUENCE || der[1] !== der.length - 2) {
    throw new Error(NOT_DER)
  }
  const [rValue, afterR] = readInteger(der, 2)
  const [sValue, end] = readInteger(der, afterR)
  if (end !== der.length) {
    throw new Error(NOT_DER)
  }
  return [rValue, sValue]
}

/**
 * Returns a P-256 ECDSA signature in the only form xrpld accepts: strict
 * (minimal) DER with a low S value, s <= (n - 1) / 2. A high-S signature
 * (r, s) becomes (r, n - s), which verifies against the same key and message.
 * Use it on the signature a WebAuthn authenticator returns before placing it
 * in a transaction's `PasskeySignature.Signature`.
 *
 * @param signature - A DER-encoded P-256 ECDSA signature, as hex or bytes.
 * @returns The normalized signature as upper-case hex.
 * @throws When the value is not a DER signature with r and s in [1, n - 1].
 */
function normalizeP256Signature(signature: string | Uint8Array): string {
  const [rValue, sValue] = decodeSignature(signature)
  const zero = BigInt(0)
  if (
    rValue === zero ||
    sValue === zero ||
    rValue >= P256_ORDER ||
    sValue >= P256_ORDER
  ) {
    throw new Error('normalizeP256Signature: r and s must be in [1, n - 1]')
  }
  const lowS = sValue > P256_HALF_ORDER ? P256_ORDER - sValue : sValue
  const body = [...encodeInteger(rValue), ...encodeInteger(lowS)]
  return bytesToHex(Uint8Array.from([DER_SEQUENCE, body.length, ...body]))
}

export default normalizeP256Signature
