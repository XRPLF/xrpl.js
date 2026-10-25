import { Currency } from '../common'
import { Account, XRPLNumber } from '../transactions/common'

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
  Flags: number

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
  AssetsTotal?: string

  /**
   * The asset amount that is available in the vault.
   */
  AssetsAvailable?: string

  /**
   * The potential loss amount that is not yet realized expressed as the vaults asset.
   */
  LossUnrealized?: string

  /**
   * The identifier of the share MPTokenIssuance object.
   */
  ShareMPTID: string

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

  /**
   * The scaling factor for vault shares. Only applicable for IOU assets.
   * Valid values are between 0 and 18 inclusive. For XRP and MPT, this is always 0.
   */
  Scale?: number

  /**
   * (LendingProtocolV1_1) The internal version of the ledger object's structure.
   */
  LEVersion?: number

  /**
   * (LendingProtocolV1_1) The kind of Vault: 0 for an open-ended vault, 1 for a
   * close-ended vault or 2 for a rolling vault (VaultContinuousAccrual).
   */
  VaultKind?: number

  /**
   * (LendingProtocolV1_1, close-ended and rolling vaults only) The time, in seconds since
   * the Ripple Epoch, up to which deposits into a close-ended Vault are accepted, or at
   * which the first dealing window of a rolling Vault opens.
   */
  SubscriptionDate?: number

  /**
   * (LendingProtocolV1_1, close-ended vaults only) The time, in seconds since the Ripple
   * Epoch, at which shares may begin to be redeemed from the Vault.
   */
  RedemptionDate?: number

  /**
   * (VaultContinuousAccrual) Scheduled loan interest not yet recognized in
   * `AssetsTotal`, expressed in the vault's asset.
   */
  UnearnedInterest?: XRPLNumber

  /**
   * (VaultContinuousAccrual) Assets earned per second, summed over the vault's
   * performing loans.
   */
  AccrualRate?: XRPLNumber

  /**
   * (VaultContinuousAccrual) Sum over the vault's accruing loans of each loan's accrual
   * rate times its `LastAccrualTime`: the accrued interest at time t is
   * `AccrualRate * t - AccrualAnchor`.
   */
  AccrualAnchor?: XRPLNumber

  /**
   * (VaultContinuousAccrual) How the vault recognizes loan interest: 0 legacy, 1 cash or
   * 2 accrual. Absent on a vault created before the amendment.
   */
  AccountingMethod?: number

  /**
   * (VaultContinuousAccrual, rolling vaults only) The number of seconds between the
   * openings of consecutive dealing windows.
   */
  DealingInterval?: number

  /**
   * (VaultContinuousAccrual, rolling vaults only) The number of seconds each dealing
   * window stays open.
   */
  DealingWindow?: number

  /**
   * (VaultContinuousAccrual, rolling vaults only) The share price, in vault asset per
   * share, that withdrawals in the current dealing window convert at.
   */
  StruckPrice?: XRPLNumber

  /**
   * (VaultContinuousAccrual, rolling vaults only) The share price, in vault asset per
   * share, that deposits in the current dealing window convert at.
   */
  StruckDepositPrice?: XRPLNumber

  /**
   * (VaultContinuousAccrual, rolling vaults only) The end, in seconds since the Ripple
   * Epoch, of the dealing window whose prices are struck.
   */
  StruckUntil?: number

  /**
   * (VaultContinuousAccrual) The fee taken from each deposit, in units of 1/10 basis point.
   */
  DepositFee?: number

  /**
   * (VaultContinuousAccrual) The fee taken from each redemption, in units of 1/10 basis
   * point.
   */
  RedemptionFee?: number

  /**
   * (VaultContinuousAccrual) The number of seconds after a holder's latest deposit during
   * which the `RedemptionFee` applies to that holder.
   */
  RedemptionPeriod?: number
}

export enum VaultFlags {
  /**
   * If set, indicates that the vault is private.
   */
  lsfVaultPrivate = 0x00010000,
}
