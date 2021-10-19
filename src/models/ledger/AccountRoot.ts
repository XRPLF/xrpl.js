import BaseLedgerEntry from './BaseLedgerEntry'

/**
 * The AccountRoot object type describes a single account, its settings, and
 * XRP balance.
 *
 * @category Ledger Entries
 */
export default interface AccountRoot extends BaseLedgerEntry {
  LedgerEntryType: 'AccountRoot'
  /** The identifying (classic) address of this account. */
  Account: string
  /** The account's current XRP balance in drops, represented as a string. */
  Balance: string
  /** A bit-map of boolean flags enabled for this account. */
  Flags: number
  /**
   * The number of objects this account owns in the ledger, which contributes
   * to its owner reserve.
   */
  OwnerCount: number
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
  /** The sequence number of the next valid transaction for this account. */
  Sequence: number
  /**
   * The identifying hash of the transaction most recently sent by this
   * account. This field must be enabled to use the AccountTxnID transaction
   * field. To enable it, send an AccountSet transaction with the.
   * `asfAccountTxnID` flag enabled.
   */
  AccountTxnID?: string
  /**
   * A domain associated with this account. In JSON, this is the hexadecimal
   * for the ASCII representation of the domain.
   */
  Domain?: string
  /** The md5 hash of an email address. */
  EmailHash?: string
  /**
   * A public key that may be used to send encrypted messages to this account
   * in JSON, uses hexadecimal.
   */
  MessageKey?: string
  /**
   * The address of a key pair that can be used to sign transactions for this
   * account instead of the master key. Use a SetRegularKey transaction to
   * change this value.
   */
  RegularKey?: string
  /**
   * How many Tickets this account owns in the ledger. This is updated
   * automatically to ensure that the account stays within the hard limit of 250.
   * Tickets at a time.
   */
  TicketCount?: number
  /**
   * How many significant digits to use for exchange rates of Offers involving
   * currencies issued by this address. Valid values are 3 to 15, inclusive.
   */
  TickSize?: number
  /**
   * A transfer fee to charge other users for sending currency issued by this
   * account to each other.
   */
  TransferRate?: number
}

export interface AccountRootFlagsInterface {
  lsfPasswordSpent?: boolean
  lsfRequireDestTag?: boolean
  lsfRequireAuth?: boolean
  lsfDisallowXRP?: boolean
  lsfDisableMaster?: boolean
  lsfNoFreeze?: boolean
  lsfGlobalFreeze?: boolean
  lsfDefaultRipple?: boolean
  lsfDepositAuth?: boolean
}

export enum AccountRootFlags {
  lsfPasswordSpent = 0x00010000,
  lsfRequireDestTag = 0x00020000,
  lsfRequireAuth = 0x00040000,
  lsfDisallowXRP = 0x00080000,
  lsfDisableMaster = 0x00100000,
  lsfNoFreeze = 0x00200000,
  lsfGlobalFreeze = 0x00400000,
  lsfDefaultRipple = 0x00800000,
  lsfDepositAuth = 0x01000000,
}
