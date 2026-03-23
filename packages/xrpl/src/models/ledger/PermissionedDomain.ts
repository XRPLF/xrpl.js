import { AuthorizeCredential } from '../common'

import { BaseLedgerEntry, HasPreviousTxnID } from './BaseLedgerEntry'

export default interface PermissionedDomain
  extends BaseLedgerEntry,
    HasPreviousTxnID {
  /* The ledger object's type (PermissionedDomain). */
  LedgerEntryType: 'PermissionedDomain'

  /* The account that controls the settings of the domain. */
  Owner: string

  /* The credentials that are accepted by the domain.
  Ownership of one of these credentials automatically
  makes you a member of the domain. */
  AcceptedCredentials: AuthorizeCredential[]

  /*  Flag values associated with this object. */
  Flags: 0

  /* Owner account's directory page containing the PermissionedDomain object. */
  OwnerNode: string

  /* The Sequence value of the PermissionedDomainSet
  transaction that created this domain. Used in combination
  with the Account to identify this domain. */
  Sequence: number
}
