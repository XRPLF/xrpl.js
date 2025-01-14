import { AuthorizeCredential } from '../common'

import { BaseLedgerEntry, HasPreviousTxnID } from './BaseLedgerEntry'

export default interface PermissionedDomain
  extends BaseLedgerEntry,
    HasPreviousTxnID {
  LedgerEntryType: 'PermissionedDomain'

  Owner: string

  Flags: 0

  OwnerNode: string

  Sequence: number

  AcceptedCredentials: AuthorizeCredential[]
}
