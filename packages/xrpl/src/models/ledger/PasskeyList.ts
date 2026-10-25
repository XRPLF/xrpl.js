import { Passkey } from '../transactions'

import { BaseLedgerEntry, HasPreviousTxnID } from './BaseLedgerEntry'

/**
 * The PasskeyList object holds the passkeys registered to an account. It is
 * created and replaced by the PasskeyListSet transaction.
 *
 * @category Ledger Entries
 */
export default interface PasskeyList extends BaseLedgerEntry, HasPreviousTxnID {
  LedgerEntryType: 'PasskeyList'

  /**
   * The account that owns this passkey list.
   */
  Owner: string

  /**
   * The passkeys of the list.
   */
  Passkeys: Passkey[]

  /**
   * A hint indicating which page of the owner's directory links to this
   * object, in case the directory consists of multiple pages.
   */
  OwnerNode: string

  /**
   * A bit-map of boolean flags. No flags are defined for the PasskeyList
   * object type, so this value is always 0.
   */
  Flags: 0
}
