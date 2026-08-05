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
}
