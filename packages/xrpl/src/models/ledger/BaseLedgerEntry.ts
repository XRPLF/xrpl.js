export interface BaseLedgerEntry {
  index: string
  /**
   * The address of the account sponsoring the reserve for this ledger object.
   * Only present if the object's reserve is being sponsored by another account.
   * This field is added when sponsorship is established and removed when
   * sponsorship is dissolved.
   *
   * Note: For RippleState objects, use HighSponsor and LowSponsor instead.
   * This field must not appear on DirectoryNode, Amendments, FeeSettings,
   * or NegativeUNL objects.
   */
  Sponsor?: string
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

export interface HasOptionalPreviousTxnID {
  /**
   * The identifying hash of the transaction that most recently modified this
   * object. This field was added in the `fixPreviousTxnID` amendment, so it
   * may not be present in every object.
   */
  PreviousTxnID?: string
  /**
   * The index of the ledger that contains the transaction that most recently
   * modified this object. This field was added in the `fixPreviousTxnID`
   * amendment, so it may not be present in every object.
   */
  PreviousTxnLgrSeq?: number
}
