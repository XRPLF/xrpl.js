import { ValidationError } from '../../errors'

import {
  BaseTransaction,
  isArray,
  isRecord,
  validateBaseTransaction,
  validateRequiredField,
} from './common'

/** Byte length of a P256 public key in rippled's encoding. */
const P256_PUBLIC_KEY_BYTE_LENGTH = 65

/** First byte of a P256 public key in rippled's encoding (`0xF6`). */
const P256_PUBLIC_KEY_PREFIX = 'F6'

/** A hex string of whole bytes; the empty string is a zero-length blob. */
const HEX_BLOB_REGEX = /^(?:[0-9A-Fa-f]{2})*$/u

/**
 * One entry of a passkey list: a WebAuthn credential registered to sign for
 * the account.
 *
 * @category Transaction Models
 */
export interface Passkey {
  Passkey: {
    /** The WebAuthn credential ID, as hex. */
    PasskeyID: string
    /**
     * The credential's P256 public key, as hex: 65 bytes beginning with `F6`.
     */
    PublicKey: string
  }
}

/**
 * The PasskeyListSet transaction sets the account's passkey list, replacing
 * any list the account already has.
 *
 * @category Transaction Models
 */
export interface PasskeyListSet extends BaseTransaction {
  TransactionType: 'PasskeyListSet'

  /**
   * The passkeys of the list. Must not be empty; no two entries may share a
   * `PasskeyID` or a `PublicKey`.
   */
  Passkeys: Passkey[]
}

/**
 * Verify one field of a Passkey inner object is a hex blob.
 *
 * @param inner - The Passkey inner object.
 * @param field - The field name.
 * @returns The field's value, upper-cased for byte comparison.
 * @throws When the field is missing or not hex.
 */
function validatePasskeyHexField(
  inner: Record<string, unknown>,
  field: 'PasskeyID' | 'PublicKey',
): string {
  const value = inner[field]
  if (value == null) {
    throw new ValidationError(`PasskeyListSet: Passkey missing field ${field}`)
  }
  if (typeof value !== 'string' || !HEX_BLOB_REGEX.test(value)) {
    throw new ValidationError(`PasskeyListSet: Passkey invalid field ${field}`)
  }
  return value.toUpperCase()
}

/**
 * Check a public key is a P256 key in rippled's encoding.
 *
 * @param publicKey - The upper-cased public key hex.
 * @returns Whether the key is 65 bytes beginning with `F6`.
 */
function isP256PublicKey(publicKey: string): boolean {
  return (
    publicKey.length === P256_PUBLIC_KEY_BYTE_LENGTH * 2 &&
    publicKey.startsWith(P256_PUBLIC_KEY_PREFIX)
  )
}

/**
 * Get the inner object of one Passkeys array element.
 *
 * @param element - The array element.
 * @returns The Passkey inner object.
 * @throws When the element is not a single-key `{ Passkey: {...} }` object.
 */
function getPasskeyInner(element: unknown): Record<string, unknown> {
  if (
    !isRecord(element) ||
    Object.keys(element).length !== 1 ||
    !isRecord(element.Passkey)
  ) {
    throw new ValidationError(
      'PasskeyListSet: each Passkeys element must be a Passkey object',
    )
  }
  return element.Passkey
}

/**
 * Verify each Passkeys element in rippled's preflight order: required fields,
 * unique PasskeyID, unique PublicKey, then a P256 PublicKey.
 *
 * @param passkeys - The Passkeys array.
 * @throws When an element is malformed or duplicated.
 */
function validatePasskeys(passkeys: unknown[]): void {
  const seenPasskeyIDs = new Set<string>()
  const seenPublicKeys = new Set<string>()

  for (const element of passkeys) {
    const inner = getPasskeyInner(element)
    const passkeyID = validatePasskeyHexField(inner, 'PasskeyID')
    const publicKey = validatePasskeyHexField(inner, 'PublicKey')

    if (seenPasskeyIDs.has(passkeyID)) {
      throw new ValidationError('PasskeyListSet: duplicate PasskeyID')
    }
    seenPasskeyIDs.add(passkeyID)

    if (seenPublicKeys.has(publicKey)) {
      throw new ValidationError('PasskeyListSet: duplicate PublicKey')
    }
    seenPublicKeys.add(publicKey)

    if (!isP256PublicKey(publicKey)) {
      throw new ValidationError(
        'PasskeyListSet: PublicKey must be a P256 public key',
      )
    }
  }
}

/**
 * Verify the form and type of a {@link PasskeyListSet} at runtime.
 *
 * @param tx - A {@link PasskeyListSet} Transaction.
 * @throws When the {@link PasskeyListSet} is malformed.
 */
export function validatePasskeyListSet(tx: Record<string, unknown>): void {
  validateBaseTransaction(tx)

  validateRequiredField(tx, 'Passkeys', isArray)

  if (tx.Passkeys.length === 0) {
    throw new ValidationError('PasskeyListSet: Passkeys must not be empty')
  }

  validatePasskeys(tx.Passkeys)
}
