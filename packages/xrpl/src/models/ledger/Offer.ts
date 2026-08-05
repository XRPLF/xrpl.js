import { Amount } from '../common'

import { BaseLedgerEntry, HasPreviousTxnID } from './BaseLedgerEntry'

export interface Book {
  Book: {
    /** The ID of the offer directory that links to this offer. */
    BookDirectory: string

    /**
     * A hint indicating which page of the offer directory links to this entry,
     * in case the directory consists of multiple pages.
     */
    BookNode: string
  }
}

export default interface Offer extends BaseLedgerEntry, HasPreviousTxnID {
  LedgerEntryType: 'Offer'
  /** A bit-map of boolean flags enabled for this Offer. */
  Flags: number
  /** The address of the account that placed this Offer. */
  Account: string
  /**
   * The Sequence value of the OfferCreate transaction that created this Offer
   * object. Used in combination with the Account to identify this Offer.
   */
  Sequence: number
  /** The remaining amount and type of currency requested by the Offer creator. */
  TakerPays: Amount
  /**
   * The remaining amount and type of currency being provided by the Offer
   * creator.
   */
  TakerGets: Amount
  /** The ID of the Offer Directory that links to this Offer. */
  BookDirectory: string
  /**
   * A hint indicating which page of the Offer Directory links to this object,
   * in case the directory consists of multiple pages.
   */
  BookNode: string
  /**
   * A hint indicating which page of the Owner Directory links to this object,
   * in case the directory consists of multiple pages.
   */
  OwnerNode: string
  /** The time this Offer expires, in seconds since the Ripple Epoch. */
  Expiration?: number
  /** The domain that the offer must be a part of. */
  DomainID?: string
  /**
   * An additional list of order book directories that this offer belongs to.
   * Currently this field only applicable to hybrid offers.
   */
  AdditionalBooks?: Book[]
}

export enum OfferFlags {
  lsfPassive = 0x00010000,
  lsfSell = 0x00020000,
  lsfHybrid = 0x00040000,
}
