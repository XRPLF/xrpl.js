import { Currency } from '../common'
import { Account } from '../transactions/common'

import { BaseLedgerEntry, HasPreviousTxnID } from './BaseLedgerEntry'

/**
 * The Vault object type represents a Single Asset Vault instance.
 *
 * @category Ledger Entries
 */
export default interface Vault extends BaseLedgerEntry, HasPreviousTxnID {
  LedgerEntryType: 'Vault'

  /**
   * Ledger object identifier.
   */
  LedgerIndex: string

  /**
   * A bit-map of boolean flags.
   */
  Flags: 0

  /**
   * The transaction sequence number that created the vault.
   */
  Sequence: number

  /**
   * Identifies the page where this item is referenced in the owner's directory.
   */
  OwnerNode: string

  /**
   * The account address of the Vault Owner.
   */
  Owner: string

  /**
   * The address of the Vaults pseudo-account.
   */
  Account: Account

  /**
   * The asset of the vault. The vault supports XRP, IOU and MPT.
   */
  Asset: Currency

  /**
   * The total value of the vault.
   */
  AssetsTotal: string

  /**
   * The asset amount that is available in the vault.
   */
  AssetsAvailable: string

  /**
   * The potential loss amount that is not yet realized expressed as the vaults asset.
   */
  LossUnrealized: string

  /**
   * The identifier of the share MPTokenIssuance object.
   */
  MPTokenIssuanceID: string

  /**
   * Indicates the withdrawal strategy used by the Vault.
   */
  WithdrawalPolicy: number

  /**
   * The maximum asset amount that can be held in the vault. Zero value 0 indicates there is no cap.
   */
  AssetsMaximum?: string

  /**
   * Arbitrary metadata about the Vault. Limited to 256 bytes.
   */
  Data?: string
}
