import { ValidationError } from '../../errors'

import {
  BaseTransaction,
  GlobalFlagsInterface,
  isAccount,
  isString,
  validateBaseTransaction,
  areAddressesEqual,
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
export interface SponsorshipTransferFlagsInterface
  extends GlobalFlagsInterface {
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
   * (Optional) The new sponsor account that will pay the reserve for the object.
   * Required for tfSponsorshipCreate and tfSponsorshipReassign scenarios.
   * Omitted for tfSponsorshipEnd scenario.
   *
   * Note: In the context of SponsorshipTransfer, this field indicates the new
   * reserve-payer for the ledger object. This is distinct from the inherited
   * BaseTransaction.Sponsor field, which when used with BaseTransaction.SponsorFlags
   * indicates fee sponsorship for the transaction itself.
   */
  Sponsor?: string
  Flags?: number | SponsorshipTransferFlagsInterface
}

/**
 * Verify the form and type of a SponsorshipTransfer at runtime.
 *
 * @param tx - A SponsorshipTransfer Transaction.
 * @throws Malformed.
 */
// eslint-disable-next-line max-lines-per-function, max-statements -- necessary for validation
export function validateSponsorshipTransfer(tx: Record<string, unknown>): void {
  validateBaseTransaction(tx)

  // Validate flag scenario - exactly one of the three scenario flags must be set
  // Handle both numeric flags and boolean flag objects
  let hasEnd = false
  let hasCreate = false
  let hasReassign = false

  if (typeof tx.Flags === 'number') {
    /* eslint-disable no-bitwise -- bitwise operations required for flag validation */
    hasEnd = (tx.Flags & SponsorshipTransferFlags.tfSponsorshipEnd) !== 0
    hasCreate = (tx.Flags & SponsorshipTransferFlags.tfSponsorshipCreate) !== 0
    hasReassign =
      (tx.Flags & SponsorshipTransferFlags.tfSponsorshipReassign) !== 0
    /* eslint-enable no-bitwise */
  } else if (typeof tx.Flags === 'object') {
    // Handle boolean flags object
    const flagsObj = tx.Flags
    hasEnd =
      'tfSponsorshipEnd' in flagsObj && flagsObj.tfSponsorshipEnd === true
    hasCreate =
      'tfSponsorshipCreate' in flagsObj && flagsObj.tfSponsorshipCreate === true
    hasReassign =
      'tfSponsorshipReassign' in flagsObj &&
      flagsObj.tfSponsorshipReassign === true
  }

  const scenarioCount =
    (hasEnd ? 1 : 0) + (hasCreate ? 1 : 0) + (hasReassign ? 1 : 0)

  if (scenarioCount === 0) {
    throw new ValidationError(
      'SponsorshipTransfer: must specify exactly one scenario flag (tfSponsorshipEnd, tfSponsorshipCreate, or tfSponsorshipReassign)',
    )
  }

  if (scenarioCount > 1) {
    throw new ValidationError(
      'SponsorshipTransfer: cannot specify multiple scenario flags (tfSponsorshipEnd, tfSponsorshipCreate, tfSponsorshipReassign are mutually exclusive)',
    )
  }

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

  // Validate Sponsor based on scenario
  const hasSponsor = tx.Sponsor !== undefined

  // tfSponsorshipEnd: Sponsor should NOT be present
  if (hasEnd && hasSponsor) {
    throw new ValidationError(
      'SponsorshipTransfer: Sponsor field must not be present for tfSponsorshipEnd scenario',
    )
  }

  // tfSponsorshipCreate or tfSponsorshipReassign: Sponsor is REQUIRED
  if ((hasCreate || hasReassign) && !hasSponsor) {
    throw new ValidationError(
      'SponsorshipTransfer: Sponsor field is required for tfSponsorshipCreate and tfSponsorshipReassign scenarios',
    )
  }

  // Validate Sponsor if present
  if (tx.Sponsor !== undefined) {
    if (!isString(tx.Sponsor)) {
      throw new ValidationError('SponsorshipTransfer: Sponsor must be a string')
    }

    // Check identity before validating address format
    if (isString(tx.Account) && areAddressesEqual(tx.Account, tx.Sponsor)) {
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
}
