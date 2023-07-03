import BaseLedgerEntry from './BaseLedgerEntry'

/**
 * The unique id for the Amendments object https://xrpl.org/amendments-object.html#amendments-id-format
 */
export const AMENDMENTS_ID =
  '7DB0788C020F02780A673DC74757F23823FA3014C1866E72CC4CD8B226CD6EF4'

/**
 * The NegativeUNL object type contains the current status of the Negative UNL,
 * a list of trusted validators currently believed to be offline.
 *
 * @category Ledger Entries
 */
export default interface NegativeUNL extends BaseLedgerEntry {
  LedgerEntryType: 'NegativeUNL'
  /**
   * A list of trusted validators that are currently disabled.
   */
  DisabledValidators?: Array<{
    FirstLedgerSequence: number
    PublicKey: string
  }>
  /**
   * The public key of a trusted validator that is scheduled to be disabled in
   * the next flag ledger.
   */
  ValidatorToDisable?: string
  /**
   * The public key of a trusted validator in the Negative UNL that is
   * scheduled to be re-enabled in the next flag ledger.
   */
  ValidatorToReEnable?: string
}
