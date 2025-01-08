import { BaseLedgerEntry, HasPreviousTxnID } from './BaseLedgerEntry'

export interface Credential {
  Credential: {
    Issuer: string
    CredentialType: string
  }
}

export default interface PermissionedDomain
  extends BaseLedgerEntry,
    HasPreviousTxnID {
  LedgerEntryType: 'PermissionedDomain'

  Owner: string

  Flags: 0

  OwnerNode: string

  Sequence: number

  AcceptedCredentials: Credential[]
}
