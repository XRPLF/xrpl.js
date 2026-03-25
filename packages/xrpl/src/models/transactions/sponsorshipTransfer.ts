import { ValidationError } from '../../errors'

import {
  BaseTransaction,
  isAccount,
  isString,
  validateBaseTransaction,
} from './common'

/**
 * A SponsorshipTransfer transaction transfers ownership of a ledger object's
 * reserve sponsorship from one sponsor to another, or removes sponsorship
 * entirely.
 *
 * This transaction allows changing which account is paying the reserve for a
 * specific ledger object (such as a trust line, offer, escrow, etc.).
 *
 * @category Transaction Models
 */
export interface SponsorshipTransfer extends BaseTransaction {
  TransactionType: 'SponsorshipTransfer'
  /**
   * The ledger object ID (index) of the object whose sponsorship is being
   * transferred. This identifies the specific ledger entry whose reserve
   * sponsorship will be changed.
   */
  LedgerIndex: string
  /**
   * The new sponsor account that will pay the reserve for the ledger object.
   * If omitted, removes sponsorship entirely (the object owner pays their own
   * reserve).
   */
  NewSponsor?: string
}

/**
 * Verify the form and type of a SponsorshipTransfer at runtime.
 *
 * @param tx - A SponsorshipTransfer Transaction.
 * @throws When the SponsorshipTransfer is malformed.
 */
export function validateSponsorshipTransfer(tx: Record<string, unknown>): void {
  validateBaseTransaction(tx)

  if (tx.LedgerIndex === undefined) {
    throw new ValidationError('SponsorshipTransfer: missing field LedgerIndex')
  }

  if (!isString(tx.LedgerIndex)) {
    throw new ValidationError(
      'SponsorshipTransfer: LedgerIndex must be a string',
    )
  }

  // LedgerIndex should be a 64-character hex string
  if (!/^[0-9A-Fa-f]{64}$/u.test(tx.LedgerIndex)) {
    throw new ValidationError(
      'SponsorshipTransfer: LedgerIndex must be a 64-character hexadecimal string',
    )
  }

  // Validate NewSponsor if present
  if (tx.NewSponsor !== undefined) {
    if (!isString(tx.NewSponsor)) {
      throw new ValidationError(
        'SponsorshipTransfer: NewSponsor must be a string',
      )
    }

    // Check identity before validating address format
    // This ensures we get the correct error message when Account and NewSponsor are the same
    if (tx.Account === tx.NewSponsor) {
      throw new ValidationError(
        'SponsorshipTransfer: Account and NewSponsor cannot be the same',
      )
    }

    if (!isAccount(tx.NewSponsor)) {
      throw new ValidationError(
        'SponsorshipTransfer: NewSponsor must be a valid account address',
      )
    }
  }
}
