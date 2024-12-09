import { BaseLedgerEntry, HasPreviousTxnID } from './BaseLedgerEntry'

// Keshava TODO: After the merge of VerifiableCredentials feature, import this interface
export interface Credential {
  Credential : {
    Issuer: string
    CredentialType: string
  }
}

export default interface PermissionedDomain extends BaseLedgerEntry, HasPreviousTxnID {
  LedgerEntryType: 'PermissionedDomain'

  Owner: string

  Flags: 0

  OwnerNode: string

  Sequence: number

  AcceptedCredentials: Credential[]
}
