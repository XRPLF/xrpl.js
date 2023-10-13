import { SignerEntry } from '../common'

import { BaseLedgerEntry, HasPreviousTxnID } from './BaseLedgerEntry'

/**
 * The SignerList object type represents a list of parties that, as a group,
 * are authorized to sign a transaction in place of an individual account. You
 * can create, replace, or remove a signer list using a SignerListSet
 * transaction.
 *
 * @category Ledger Entries
 */
export default interface SignerList extends BaseLedgerEntry, HasPreviousTxnID {
  LedgerEntryType: 'SignerList'
  /**
   * A bit-map of Boolean flags enabled for this signer list. For more
   * information, see SignerList Flags.
   */
  Flags: number
  /**
   * A hint indicating which page of the owner directory links to this object,
   * in case the directory consists of multiple pages.
   */
  OwnerNode: string
  /**
   * An array of Signer Entry objects representing the parties who are part of
   * this signer list.
   */
  SignerEntries: SignerEntry[]
  /**
   * An ID for this signer list. Currently always set to 0. If a future
   * amendment allows multiple signer lists for an account, this may change.
   */
  SignerListID: number
  /**
   * A target number for signer weights. To produce a valid signature for the
   * owner of this SignerList, the signers must provide valid signatures whose
   * weights sum to this value or more.
   */
  SignerQuorum: number
}

export enum SignerListFlags {
  // True, uses only one OwnerCount
  lsfOneOwnerCount = 0x00010000,
}
