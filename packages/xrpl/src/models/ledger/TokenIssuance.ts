import { XRPLNumber } from '../transactions/common'

import { BaseLedgerEntry, HasPreviousTxnID } from './BaseLedgerEntry'

/**
 * Enum for TokenIssuance ledger entry flags.
 *
 * @category Ledger Entry Flags
 */
export enum TokenIssuanceFlags {
  /** The currency is locked: a per-currency global freeze. */
  lsfTokenLocked = 0x00000001,
  /** The issuer renounced locking the currency. */
  lsfTokenCannotLock = 0x00000002,
  /** The entry is owned by a pseudo-account (blackholed issuer). */
  lsfTokenWrapped = 0x00000004,
  /** IssuedAmount reflects the verified legacy supply. */
  lsfTokenVerifiedSupply = 0x00000008,
}

/**
 * The TokenIssuance object describes an issuer's IOU currency and, when bound,
 * the MPT issuance the IOU converts to and from with TokenConvert.
 *
 * @category Ledger Entries
 */
export default interface TokenIssuance
  extends BaseLedgerEntry, HasPreviousTxnID {
  LedgerEntryType: 'TokenIssuance'

  /** A bit-map of boolean flags; see {@link TokenIssuanceFlags}. */
  Flags: number

  /** The issuer of the currency. */
  Issuer: string

  /** The currency code of the IOU. */
  Currency: string

  /** The supply cap, in base units, as a base-10 integer string. */
  MaximumAmount?: string

  /** The amount of the IOU issued. */
  IssuedAmount?: XRPLNumber

  /**
   * The number of decimal places of one base unit: one base unit is
   * 10^-TokenScale of the IOU.
   */
  TokenScale?: number

  /** The MPTokenIssuance bound to this IOU. */
  MPTokenIssuanceID?: string

  /** The transfer fee in tenths of a basis point, between 0 and 50,000. */
  TransferFee?: number

  /** Arbitrary metadata in hex. */
  MPTokenMetadata?: string

  /** The page of the issuer's owner directory that references this entry. */
  OwnerNode: string

  /** The account sponsoring the reserve for this entry. */
  Sponsor?: string
}
