import { ValidationError } from '../../errors'
import { SignerEntry } from '../common'

import {
  BaseTransaction,
  isArray,
  isNumber,
  isRecord,
  isString,
  validateBaseTransaction,
  validateRequiredField,
} from './common'

/**
 * The SignerListSet transaction creates, replaces, or removes a list of
 * signers that can be used to multi-sign a transaction.
 *
 * @category Transaction Models
 */
export interface SignerListSet extends BaseTransaction {
  TransactionType: 'SignerListSet'
  /**
   * A target number for the signer weights. A multi-signature from this list
   * is valid only if the sum weights of the signatures provided is greater than
   * or equal to this value. To delete a signer list, use the value 0.
   */
  SignerQuorum: number
  /**
   * Array of SignerEntry objects, indicating the addresses and weights of
   * signers in this list. This signer list must have at least 1 member and no
   * more than 32 members. No address may appear more than once in the list, nor
   * may the Account submitting the transaction appear in the list.
   */
  SignerEntries?: SignerEntry[]
}

const MAX_SIGNERS = 32

const HEX_WALLET_LOCATOR_REGEX = /^[0-9A-Fa-f]{64}$/u

/**
 * Verify the form and type of an SignerListSet at runtime.
 *
 * @param tx - An SignerListSet Transaction.
 * @throws When the SignerListSet is Malformed.
 */
export function validateSignerListSet(tx: Record<string, unknown>): void {
  validateBaseTransaction(tx)

  validateRequiredField(tx, 'SignerQuorum', isNumber)

  // All other checks are for if SignerQuorum is greater than 0
  if (tx.SignerQuorum === 0) {
    return
  }

  validateRequiredField(tx, 'SignerEntries', isArray)
  if (tx.SignerEntries.length === 0) {
    throw new ValidationError(
      'SignerListSet: need at least 1 member in SignerEntries',
    )
  }

  if (tx.SignerEntries.length > MAX_SIGNERS) {
    throw new ValidationError(
      `SignerListSet: maximum of ${MAX_SIGNERS} members allowed in SignerEntries`,
    )
  }

  for (const entry of tx.SignerEntries) {
    if (!isRecord(entry) || !isRecord(entry.SignerEntry)) {
      throw new ValidationError(
        'SignerListSet: SignerEntries must be an array of SignerEntry objects',
      )
    }
    const signerEntry = entry.SignerEntry
    const { WalletLocator } = signerEntry
    if (
      WalletLocator != null &&
      (!isString(WalletLocator) ||
        !HEX_WALLET_LOCATOR_REGEX.test(WalletLocator))
    ) {
      throw new ValidationError(
        `SignerListSet: WalletLocator in SignerEntry must be a 256-bit (32-byte) hexadecimal value`,
      )
    }
  }
}
