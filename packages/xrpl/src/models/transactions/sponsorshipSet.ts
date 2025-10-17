import { ValidationError } from '../../errors'
import { Signer } from '../common'

import {
  BaseTransaction,
  GlobalFlagsInterface,
  isAccount,
  isNumber,
  isString,
  validateBaseTransaction,
  validateOptionalField,
} from './common'

export enum SponsorFlags {
  /** Sponsor will pay the fee for the transaction. */
  tfSponsorFee = 0x00000001,
  /** Sponsor will burden the reserves of the transaction. */
  tfSponsorReserve = 0x00000002,
}

export interface Sponsor {
  Account: string
  Flags: number | SponsorFlags
}

export interface SponsorSignature {
  SigningPubKey?: string
  TxnSignature?: string
  Signers?: Signer[]
}

/**
 * Enum representing values of {@link SponsorshipSet} transaction flags.
 *
 * @category Transaction Flags
 */
export enum SponsorshipSetFlags {
  tfSponsorshipSetRequireSignForFee = 0x00010000,
  tfSponsorshipClearRequireSignForFee = 0x00020000,
  tfSponsorshipSetRequireSignForReserve = 0x00040000,
  tfSponsorshipClearRequireSignForReserve = 0x00080000,
  tfDeleteObject = 0x00100000,
}

/**
 * Map of flags to boolean values representing {@link SponsorshipSet} transaction
 * flags.
 *
 * @category Transaction Flags
 */
export interface SponsorshipSetFlagsInterface extends GlobalFlagsInterface {
  tfSponsorshipSetRequireSignForFee?: boolean
  tfSponsorshipClearRequireSignForFee?: boolean
  tfSponsorshipSetRequireSignForReserve?: boolean
  tfSponsorshipClearRequireSignForReserve?: boolean
  tfDeleteObject?: boolean
}

/**
 * A SponsorshipSet transaction creates, changes, or removes the sponsorship
 * of an account or object.
 *
 * @category Transaction Models
 */
export interface SponsorshipSet extends BaseTransaction {
  TransactionType: 'SponsorshipSet'
  Flags?: number | SponsorshipSetFlagsInterface
  /**
   * The account that is sponsoring the account or object.
   */
  SponsorAccount?: string
  /**
   * The account that is being sponsored.
   */
  Sponsee?: string
  /**
   * The total amount of fee to be allowed to be paid for the sponsored transaction.
   */
  FeeAmount?: string
  /**
   * The maximum amount of fee to be paid for the one transaction.
   */
  MaxFee?: string
  /**
   * The number of reserves to be allowed to be burned for the sponsored transaction.
   */
  ReserveCount?: number
}

/**
 * Verify the form and type of a SponsorshipSet at runtime.
 *
 * @param tx - A SponsorshipSet Transaction.
 * @throws When the SponsorshipSet is malformed.
 */
export function validateSponsorshipSet(tx: Record<string, unknown>): void {
  validateBaseTransaction(tx)

  validateOptionalField(tx, 'SponsorAccount', isAccount)
  validateOptionalField(tx, 'Sponsee', isAccount)

  if (tx.SponsorAccount === undefined && tx.Sponsee === undefined) {
    throw new ValidationError(
      'SponsorshipSet: SponsorAccount or Sponsee must be set, but not both',
    )
  }
  if (tx.SponsorAccount !== undefined && tx.Sponsee !== undefined) {
    throw new ValidationError(
      'SponsorshipSet: SponsorAccount and Sponsee cannot be both set',
    )
  }

  validateOptionalField(tx, 'FeeAmount', isString)
  validateOptionalField(tx, 'MaxFee', isString)
  validateOptionalField(tx, 'ReserveCount', isNumber)
}
