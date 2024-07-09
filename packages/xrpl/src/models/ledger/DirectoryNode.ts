import { BaseLedgerEntry, HasOptionalPreviousTxnID } from './BaseLedgerEntry'

/**
 * The DirectoryNode object type provides a list of links to other objects in
 * the ledger's state tree.
 *
 * @category Ledger Entries
 */
export default interface DirectoryNode
  extends BaseLedgerEntry,
    HasOptionalPreviousTxnID {
  LedgerEntryType: 'DirectoryNode'
  /**
   * A bit-map of boolean flags enabled for this directory. Currently, the
   * protocol defines no flags for DirectoryNode objects.
   */
  Flags: number
  /** The ID of root object for this directory. */
  RootIndex: string
  /** The contents of this Directory: an array of IDs of other objects. */
  Indexes: string[]
  /**
   * If this Directory consists of multiple pages, this ID links to the next
   * object in the chain, wrapping around at the end.
   */
  IndexNext?: number
  /**
   * If this Directory consists of multiple pages, this ID links to the
   * previous object in the chain, wrapping around at the beginning.
   */
  IndexPrevious?: number
  /** The address of the account that owns the objects in this directory. */
  Owner?: string
  /**
   * The currency code of the TakerPays amount from the offers in this
   * directory.
   */
  TakerPaysCurrency?: string
  /** The issuer of the TakerPays amount from the offers in this directory. */
  TakerPaysIssuer?: string
  /**
   * The currency code of the TakerGets amount from the offers in this
   * directory.
   */
  TakerGetsCurrency?: string
  /** The issuer of the TakerGets amount from the offers in this directory. */
  TakerGetsIssuer?: string
}
