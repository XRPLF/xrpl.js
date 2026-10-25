import { p256 } from '@noble/curves/nist.js'
import { bytesToHex, hexToBytes } from '@xrplf/isomorphic/utils'

import { normalizeP256Signature } from '../src'

const HALF_ORDER = BigInt(
  '0x7FFFFFFF800000007FFFFFFFFFFFFFFFDE737D56D38BCF4279DCE5617E3192A8',
)

/**
 * The INTEGER rules of xrpld's sigPart (PublicKey.cpp:62-85): tag 0x02,
 * length 1 to 33, not negative, no zero value, no needless leading zero.
 *
 * @param der - The signature bytes.
 * @param offset - The offset of the INTEGER's tag.
 * @returns The value and the offset past it.
 * @throws When the INTEGER breaks a rule.
 */
function readStrictInteger(der: Uint8Array, offset: number): [bigint, number] {
  const len = der[offset + 1]
  const body = der.slice(offset + 2, offset + 2 + len)
  const valid =
    der[offset] === 0x02 &&
    len >= 1 &&
    len <= 33 &&
    body.length === len &&
    body[0] < 0x80 &&
    !(body[0] === 0 && (len === 1 || body[1] < 0x80))
  if (!valid) {
    throw new Error('not a strict DER INTEGER')
  }
  return [BigInt(`0x${bytesToHex(body)}`), offset + 2 + len]
}

/**
 * xrpld's P-256 signature form check (#29, PublicKey.cpp parseDERSignature and
 * verify): strict DER SEQUENCE { r, s } and s <= (n - 1) / 2.
 *
 * @param hex - The signature as hex.
 * @returns Whether the node accepts the signature's form.
 */
function nodeAcceptsForm(hex: string): boolean {
  const der = hexToBytes(hex)
  if (der.length < 8 || der.length > 72 || der[0] !== 0x30) {
    return false
  }
  if (der[1] !== der.length - 2) {
    return false
  }
  try {
    const [, afterR] = readStrictInteger(der, 2)
    const [sValue, end] = readStrictInteger(der, afterR)
    return end === der.length && sValue <= HALF_ORDER
  } catch {
    return false
  }
}

describe('normalizeP256Signature', () => {
  it('returns (r, n - s) in strict DER for a high-S signature', () => {
    // r = 1, s = n - 1
    const highS =
      '3026020101022100FFFFFFFF00000000FFFFFFFFFFFFFFFFBCE6FAADA7179E84F3B9CAC2FC632550'
    expect(nodeAcceptsForm(highS)).toBe(false)
    const normalized = normalizeP256Signature(highS)
    expect(normalized).toEqual('3006020101020101')
    expect(nodeAcceptsForm(normalized)).toBe(true)
  })

  it('maps s = (n - 1) / 2 + 1 to (n - 1) / 2', () => {
    const highS =
      '30250201010220 7FFFFFFF800000007FFFFFFFFFFFFFFFDE737D56D38BCF4279DCE5617E3192A9'.replace(
        ' ',
        '',
      )
    expect(normalizeP256Signature(highS)).toEqual(
      '302502010102207FFFFFFF800000007FFFFFFFFFFFFFFFDE737D56D38BCF4279DCE5617E3192A8',
    )
  })

  it('leaves a low-S strict DER signature unchanged', () => {
    const lowS =
      '302502010102207FFFFFFF800000007FFFFFFFFFFFFFFFDE737D56D38BCF4279DCE5617E3192A8'
    expect(normalizeP256Signature(lowS)).toEqual(lowS)
  })

  it('accepts bytes and lower-case hex', () => {
    const highS =
      '3026020101022100ffffffff00000000ffffffffffffffffbce6faada7179e84f3b9cac2fc632550'
    expect(normalizeP256Signature(hexToBytes(highS))).toEqual(
      '3006020101020101',
    )
    expect(normalizeP256Signature(highS)).toEqual('3006020101020101')
  })

  it('re-encodes padded INTEGERs minimally', () => {
    // r = 0x0001 is a needless leading zero; xrpld refuses it.
    const padded = '30070202000102010A'
    expect(nodeAcceptsForm(padded)).toBe(false)
    expect(normalizeP256Signature(padded)).toEqual('300602010102010A')
  })

  it('normalizes a real high-S signature so that it still verifies', () => {
    const secretKey = hexToBytes(
      'C9AFA9D845BA75166B5C215767B1D6934E50C3DB36E89B127B8A622B120F6721',
    )
    const publicKey = p256.getPublicKey(secretKey, false)
    const signed = Array.from({ length: 64 }, (_unused, index) => {
      const message = new TextEncoder().encode(`passkey challenge ${index}`)
      return {
        message,
        der: p256.sign(message, secretKey, { lowS: false, format: 'der' }),
      }
    }).find(({ der }) => !nodeAcceptsForm(bytesToHex(der)))
    if (signed === undefined) {
      throw new Error('no high-S signature among the messages')
    }

    const normalized = normalizeP256Signature(bytesToHex(signed.der))
    expect(nodeAcceptsForm(normalized)).toBe(true)
    expect(
      p256.verify(hexToBytes(normalized), signed.message, publicKey, {
        format: 'der',
        lowS: true,
      }),
    ).toBe(true)
  })

  it('throws on a value that is not a DER signature', () => {
    expect(() => normalizeP256Signature('3006020101')).toThrow(
      'normalizeP256Signature: not a DER ECDSA signature',
    )
    expect(() => normalizeP256Signature('zz')).toThrow(
      'normalizeP256Signature: not a DER ECDSA signature',
    )
  })

  it('throws when r or s is zero or not below the group order', () => {
    expect(() => normalizeP256Signature('3006020100020101')).toThrow(
      'normalizeP256Signature: r and s must be in [1, n - 1]',
    )
    const sIsN =
      '3026020101022100FFFFFFFF00000000FFFFFFFFFFFFFFFFBCE6FAADA7179E84F3B9CAC2FC632551'
    expect(() => normalizeP256Signature(sIsN)).toThrow(
      'normalizeP256Signature: r and s must be in [1, n - 1]',
    )
  })
})
