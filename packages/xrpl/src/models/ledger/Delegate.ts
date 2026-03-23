import { Permission } from '../transactions'

import { BaseLedgerEntry, HasPreviousTxnID } from './BaseLedgerEntry'

/**
 * This object represents a set of permissions that an account has delegated to another account.
 *
 * @category Ledger Entries
 */
export default interface Delegate extends BaseLedgerEntry, HasPreviousTxnID {
  LedgerEntryType: 'Delegate'

  /**
   * The account that wants to authorize another account.
   */
  Account: string

  /**
   * The authorized account.
   */
  Authorize: string

  /**
   * The transaction permissions that the account has access to.
   */
  Permissions: Permission[]

  /**
   * A hint indicating which page of the sender's owner directory links to this object,
   * in case the directory consists of multiple pages.
   */
  OwnerNode: string

  /**
   * A bit-map of boolean flags. No flags are defined for the Delegate object
   * type, so this value is always 0.
   */
  Flags: 0
}
