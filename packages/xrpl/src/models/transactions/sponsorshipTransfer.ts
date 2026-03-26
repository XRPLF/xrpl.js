import { ValidationError } from '../../errors'

import {
  BaseTransaction,
  GlobalFlagsInterface,
  isAccount,
  isString,
  validateBaseTransaction,
} from './common'

/**
 * Flags for the SponsorshipTransfer transaction.
 *
 * @category Transaction Flags
 */
export enum SponsorshipTransferFlags {
  /**
   * End an existing sponsorship relationship for the specified object.
   */
  tfSponsorshipEnd = 0x00010000,
  /**
   * Create a new sponsorship relationship for the specified object.
   */
  tfSponsorshipCreate = 0x00020000,
  /**
   * Reassign sponsorship from one sponsor to another for the specified object.
   */
  tfSponsorshipReassign = 0x00040000,
}

/**
 * Map of flags to boolean values representing the SponsorshipTransfer transaction
 * flags.
 *
 * @category Transaction Flags
 */
export interface SponsorshipTransferFlagsInterface extends GlobalFlagsInterface {
  /**
   * End an existing sponsorship relationship for the specified object.
   */
  tfSponsorshipEnd?: boolean
  /**
   * Create a new sponsorship relationship for the specified object.
   */
  tfSponsorshipCreate?: boolean
  /**
   * Reassign sponsorship from one sponsor to another for the specified object.
   */
  tfSponsorshipReassign?: boolean
}

/**
 * A SponsorshipTransfer transaction transfers ownership of a ledger object's
 * reserve sponsorship from one sponsor to another, creates a new sponsorship,
 * or removes sponsorship entirely.
 *
 * This transaction allows changing which account is paying the reserve for a
 * specific ledger object (such as a trust line, offer, escrow, etc.) or for
 * account-level sponsorship.
 *
 * @category Transaction Models
 */
export interface SponsorshipTransfer extends BaseTransaction {
  TransactionType: 'SponsorshipTransfer'
  /**
   * (Optional) The ledger object ID of the object whose sponsorship is being
   * transferred. This identifies the specific ledger entry whose reserve
   * sponsorship will be changed. When omitted, this transaction refers to
   * account-level sponsorship.
   */
  ObjectID?: string
  /**
   * (Optional) The new or existing sponsor account that will pay the reserve.
   * Required for tfSponsorshipCreate and tfSponsorshipReassign scenarios.
   * Omitted for tfSponsorshipEnd scenario.
   */
  Sponsor?: string
  /**
   * (Optional) Flags specific to this transaction indicating sponsorship
   * requirements or constraints.
   */
  SponsorFlags?: number
  Flags?: number | SponsorshipTransferFlagsInterface
}

/**
 * Verify the form and type of a SponsorshipTransfer at runtime.
 *
 * @param tx - A SponsorshipTransfer Transaction.
 * @throws Malformed.
 */
export function validateSponsorshipTransfer(tx: Record<string, unknown>): void {
  validateBaseTransaction(tx)

  // Validate ObjectID if present (optional for account-level sponsorship)
  if (tx.ObjectID !== undefined) {
    if (!isString(tx.ObjectID)) {
      throw new ValidationError(
        'SponsorshipTransfer: ObjectID must be a string',
      )
    }

    // ObjectID should be a 64-character hex string (ledger object ID)
    if (!/^[0-9A-Fa-f]{64}$/u.test(tx.ObjectID)) {
      throw new ValidationError(
        'SponsorshipTransfer: ObjectID must be a 64-character hexadecimal string',
      )
    }
  }

  // Validate Sponsor if present
  if (tx.Sponsor !== undefined) {
    if (!isString(tx.Sponsor)) {
      throw new ValidationError('SponsorshipTransfer: Sponsor must be a string')
    }

    // Check identity before validating address format
    if (tx.Account === tx.Sponsor) {
      throw new ValidationError(
        'SponsorshipTransfer: Account and Sponsor cannot be the same',
      )
    }

    if (!isAccount(tx.Sponsor)) {
      throw new ValidationError(
        'SponsorshipTransfer: Sponsor must be a valid account address',
      )
    }
  }

  // Validate SponsorFlags if present
  if (tx.SponsorFlags !== undefined) {
    if (typeof tx.SponsorFlags !== 'number') {
      throw new ValidationError(
        'SponsorshipTransfer: SponsorFlags must be a number',
      )
    }

    if (tx.SponsorFlags < 0 || !Number.isInteger(tx.SponsorFlags)) {
      throw new ValidationError(
        'SponsorshipTransfer: SponsorFlags must be a non-negative integer',
      )
    }
  }
}
