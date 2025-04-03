import { Currency, MPTAmount } from '../common'
import { GlobalFlags } from '../transactions/common'

import { BaseLedgerEntry, HasPreviousTxnID } from './BaseLedgerEntry'

export interface VaultFlags extends GlobalFlags {
  /** If set, indicates that the vault is private. */
  lsfVaultPrivate?: boolean
}

/**
 *
 * A Credential object describes a credential, similar to a passport, which is an issuable identity verifier
 * that can be used as a prerequisite for other transactions
 *
 * @category Ledger Entries
 */
export default interface Vault extends BaseLedgerEntry, HasPreviousTxnID {
  LedgerEntryType: 'Vault'
  /**
   * A bit-map of boolean flags
   */
  Flags: number | VaultFlags

  /** The transaction sequence number that created the vault. */
  Sequence: number

  /** Identifies the page where this item is referenced in the owner's directory. */
  OwnerNode: number

  /** The account address of the Vault Owner. */
  Owner: string

  /** The address of the Vaults pseudo-account. */
  Account: string

  /** Arbitrary metadata about the Vault. Limited to 256 bytes. */
  Data?: string

  /** The asset of the vault. The vault supports XRP, IOU and MPT. */
  Asset: string | Currency | MPTAmount

  /** The total value of the vault. */
  AssetTotal: number

  /** The asset amount that is available in the vault. */
  AssetAvailable: number

  /** The potential loss amount that is not yet realized expressed as the vaults asset. */
  LossUnrealized: number

  /** The maximum asset amount that can be held in the vault. Zero value 0 indicates there is no cap. */
  AssetMaximum: number

  /** The identifier of the share MPTokenIssuance object. */
  MPTokenIssuanceID: number

  /** Indicates the withdrawal strategy used by the Vault. */
  WithdrawalPolicy: string
}
