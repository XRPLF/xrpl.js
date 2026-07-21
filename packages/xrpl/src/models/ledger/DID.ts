import { BaseLedgerEntry, HasPreviousTxnID } from './BaseLedgerEntry'

// TODO: add docs

/**
 * @category Ledger Entries
 */
export default interface DID extends BaseLedgerEntry, HasPreviousTxnID {
  LedgerEntryType: 'DID'

  Account: string

  Data: string

  DIDDocument: string

  URI: string

  Flags: 0

  OwnerNode: string

  /**
   * (Optional) The account sponsoring the reserve for this DID. If present,
   * the sponsor is responsible for the reserve requirement of this object
   * instead of the owner.
   */
  Sponsor?: string
}
