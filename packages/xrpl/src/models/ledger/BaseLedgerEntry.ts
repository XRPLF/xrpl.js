export interface BaseLedgerEntry {
  index: string
}

export interface HasPreviousTxnID {
  /**
   * The identifying hash of the transaction that most recently modified this
   * object.
   */
  PreviousTxnID: string
  /**
   * The index of the ledger that contains the transaction that most recently
   * modified this object.
   */
  PreviousTxnLgrSeq: number
}

export interface MissingPreviousTxnID {
  /**
   * This field is missing on this object but is present on most other returned objects.
   */
  PreviousTxnID: never
  /**
   * This field is missing on this object but is present on most other returned objects.
   */
  PreviousTxnLgrSeq: never
}
