import { BaseLedgerEntry, HasOptionalPreviousTxnID } from './BaseLedgerEntry'

/**
 * The unique id for the nUNL object https://xrpl.org/negativeunl.html#negativeunl-id-format
 */
export const NEGATIVE_UNL_ID =
  '2E8A59AA9D3B5B186B0B9E0F62E6C02587CA74A4D778938E957B6357D364B244'

/**
 * The NegativeUNL object type contains the current status of the Negative UNL,
 * a list of trusted validators currently believed to be offline.
 *
 * @category Ledger Entries
 */
export default interface NegativeUNL
  extends BaseLedgerEntry,
    HasOptionalPreviousTxnID {
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
