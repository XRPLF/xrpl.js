import { ValidationError } from '../../errors'

import {
  Account,
  BaseTransaction,
  GlobalFlagsInterface,
  isAccount,
  isNumber,
  isString,
  validateBaseTransaction,
  validateOptionalField,
} from './common'

/**
 * Enum representing flags for the SponsorshipSet transaction.
 *
 * @category Transaction Flags
 */
export enum SponsorshipSetFlags {
  /**
   * Adds the restriction that every use of this sponsor for sponsoring fees
   * requires a signature from the sponsor.
   */
  tfSponsorshipSetRequireSignForFee = 0x00010000,
  /**
   * Removes the restriction that every use of this sponsor for sponsoring fees
   * requires a signature from the sponsor.
   */
  tfSponsorshipClearRequireSignForFee = 0x00020000,
  /**
   * Adds the restriction that every use of this sponsor for sponsoring reserves
   * requires a signature from the sponsor.
   */
  tfSponsorshipSetRequireSignForReserve = 0x00040000,
  /**
   * Removes the restriction that every use of this sponsor for sponsoring
   * reserves requires a signature from the sponsor.
   */
  tfSponsorshipClearRequireSignForReserve = 0x00080000,
  /**
   * Removes the Sponsorship ledger object.
   */
  tfDeleteObject = 0x00100000,
}

/**
 * Map of flags to boolean values representing {@link SponsorshipSet} transaction
 * flags.
 *
 * @category Transaction Flags
 */
export interface SponsorshipSetFlagsInterface extends GlobalFlagsInterface {
  /**
   * Adds the restriction that every use of this sponsor for sponsoring fees
   * requires a signature from the sponsor.
   */
  tfSponsorshipSetRequireSignForFee?: boolean
  /**
   * Removes the restriction that every use of this sponsor for sponsoring fees
   * requires a signature from the sponsor.
   */
  tfSponsorshipClearRequireSignForFee?: boolean
  /**
   * Adds the restriction that every use of this sponsor for sponsoring reserves
   * requires a signature from the sponsor.
   */
  tfSponsorshipSetRequireSignForReserve?: boolean
  /**
   * Removes the restriction that every use of this sponsor for sponsoring
   * reserves requires a signature from the sponsor.
   */
  tfSponsorshipClearRequireSignForReserve?: boolean
  /**
   * Removes the Sponsorship ledger object.
   */
  tfDeleteObject?: boolean
}

/**
 * A SponsorshipSet transaction creates, updates, or deletes a Sponsorship
 * ledger object. The Sponsorship object represents a pre-funded sponsorship
 * relationship between a sponsor and a sponsee.
 *
 * @category Transaction Models
 */
export interface SponsorshipSet extends BaseTransaction {
  TransactionType: 'SponsorshipSet'
  /**
   * The sponsor associated with this relationship. This account also pays for
   * the reserve of this object. If this field is included, the Account is
   * assumed to be the Sponsee.
   */
  Sponsor?: Account
  /**
   * The sponsee associated with this relationship. If this field is included,
   * the Account is assumed to be the Sponsor.
   */
  Sponsee?: Account
  /**
   * The (remaining) amount of XRP (in drops) that the sponsor has provided for
   * the sponsee to use for fees. This value will replace what is currently in
   * the Sponsorship.FeeAmount field (if it exists).
   */
  FeeAmount?: string
  /**
   * The maximum fee per transaction that will be sponsored. This is to prevent
   * abuse/excessive draining of the sponsored fee pool.
   */
  MaxFee?: string
  /**
   * The (remaining) amount of reserves that the sponsor has provided for the
   * sponsee to use. This value will replace what is currently in the
   * Sponsorship.ReserveCount field (if it exists).
   */
  ReserveCount?: number
  Flags?: number | SponsorshipSetFlagsInterface
}

/**
 * Verify the form and type of a SponsorshipSet at runtime.
 *
 * @param tx - A SponsorshipSet Transaction.
 * @throws When the SponsorshipSet is malformed.
 */
export function validateSponsorshipSet(tx: Record<string, unknown>): void {
  validateBaseTransaction(tx)

  // Must have exactly one of Sponsor or Sponsee
  const hasSponsor = tx.Sponsor !== undefined
  const hasSponsee = tx.Sponsee !== undefined

  if (hasSponsor && hasSponsee) {
    throw new ValidationError(
      'SponsorshipSet: cannot specify both Sponsor and Sponsee',
    )
  }

  if (!hasSponsor && !hasSponsee) {
    throw new ValidationError(
      'SponsorshipSet: must specify either Sponsor or Sponsee',
    )
  }

  validateOptionalField(tx, 'Sponsor', isAccount)
  validateOptionalField(tx, 'Sponsee', isAccount)
  validateOptionalField(tx, 'FeeAmount', isString)
  validateOptionalField(tx, 'MaxFee', isString)
  validateOptionalField(tx, 'ReserveCount', isNumber)

  // Validate flag combinations with tfDeleteObject
  const flags = typeof tx.Flags === 'number' ? tx.Flags : 0
  const tfDeleteObject = SponsorshipSetFlags.tfDeleteObject

  if (flags === tfDeleteObject) {
    // When deleting, cannot specify FeeAmount, MaxFee, or ReserveCount
    if (tx.FeeAmount !== undefined) {
      throw new ValidationError(
        'SponsorshipSet: FeeAmount cannot be specified with tfDeleteObject',
      )
    }
    if (tx.MaxFee !== undefined) {
      throw new ValidationError(
        'SponsorshipSet: MaxFee cannot be specified with tfDeleteObject',
      )
    }
    if (tx.ReserveCount !== undefined) {
      throw new ValidationError(
        'SponsorshipSet: ReserveCount cannot be specified with tfDeleteObject',
      )
    }
  }
}
