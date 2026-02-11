import { BaseLedgerEntry, HasPreviousTxnID } from './BaseLedgerEntry'

/**
 * Enum representing flags for a Sponsorship ledger entry.
 *
 * @category Ledger Entry Flags
 */
export enum SponsorshipFlags {
  /**
   * If set, each sponsored fee transaction requires a signature from the sponsor.
   */
  lsfRequireSignForFee = 0x00010000,
  /**
   * If set, each sponsored reserve transaction requires a signature from the sponsor.
   */
  lsfRequireSignForReserve = 0x00020000,
}

/**
 * A boolean map of SponsorshipFlags for simplified code checking Sponsorship settings.
 *
 * @category Ledger Entry Flags
 */
export interface SponsorshipFlagsInterface {
  /**
   * If set, each sponsored fee transaction requires a signature from the sponsor.
   */
  lsfRequireSignForFee?: boolean
  /**
   * If set, each sponsored reserve transaction requires a signature from the sponsor.
   */
  lsfRequireSignForReserve?: boolean
}

/**
 * The Sponsorship object represents a pre-funded sponsorship relationship
 * between a sponsor and a sponsee. It allows the sponsor to pay transaction
 * fees and/or reserves on behalf of the sponsee.
 *
 * @category Ledger Entries
 */
export default interface Sponsorship extends BaseLedgerEntry, HasPreviousTxnID {
  LedgerEntryType: 'Sponsorship'
  /** A bit-map of boolean flags enabled for this sponsorship. */
  Flags: number
  /**
   * The address of the sponsor account. This account pays for the reserve
   * of this ledger entry.
   */
  Owner: string
  /**
   * The address of the sponsee account (the account being sponsored).
   */
  Sponsee: string
  /**
   * The remaining amount of XRP (in drops) that the sponsor has provided
   * for the sponsee to use for transaction fees.
   */
  FeeAmount: string
  /**
   * The maximum fee per transaction that will be sponsored. This is to
   * prevent abuse/excessive draining of the sponsored fee pool.
   */
  MaxFee?: string
  /**
   * The remaining number of reserves that the sponsor has provided for the
   * sponsee to use. Each unit represents one object reserve.
   */
  ReserveCount: number
  /**
   * A hint indicating which page of the sponsor's (owner's) directory links
   * to this object, in case the directory consists of multiple pages.
   */
  OwnerNode: string
  /**
   * A hint indicating which page of the sponsee's directory links to this
   * object, in case the directory consists of multiple pages.
   */
  SponseeNode: string
}
