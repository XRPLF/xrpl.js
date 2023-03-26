import BaseLedgerEntry from './BaseLedgerEntry'

/**
 * The HookState object type contains the
 *
 * @category Ledger Entries
 */
export default interface HookState extends BaseLedgerEntry {
  LedgerEntryType: 'HookState'

  /**
   * A hint indicating which page of the sender's owner directory links to this
   * object, in case the directory consists of multiple pages.
   */
  OwnerNode: string

  /**
   * The HookStateKey property contains the key associated with this hook state,
   * and the HookStateData property contains the data associated with this hook state.
   */
  HookStateKey: string

  /**
   * The `HookStateData` property contains the data associated with this hook state.
   * It is typically a string containing the data associated with this hook state,
   * such as an identifier or other information.
   */
  HookStateData: string
}
