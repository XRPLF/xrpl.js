import { ValidationError } from '../../errors'
import { Currency } from '../common'
import { hasFlag, isHex } from '../utils'
import {
  MAX_MPT_META_BYTE_LENGTH,
  MPT_META_WARNING_HEADER,
  validateMPTokenMetadata,
} from '../utils/mptokenMetadata'

import {
  BaseTransaction,
  validateBaseTransaction,
  GlobalFlagsInterface,
  validateOptionalField,
  isNumber,
  isCurrency,
  validateRequiredField,
  VAULT_DATA_MAX_BYTE_LENGTH,
  XRPLNumber,
  isXRPLNumber,
  isHexString,
  isString,
} from './common'
import { validateRedemptionPeriod, validateVaultFees } from './vaultFees'

const MAX_SCALE = 18

/**
 * (LendingProtocolV1_1) Minimum length, in seconds, of a close-ended vault's investment
 * period (`RedemptionDate - SubscriptionDate`). 180s is the smallest window
 * that can still fit a minimum-interval loan plus the 60s redemption buffer
 * enforced by LoanSet (see rippled `kMinInvestmentPeriod`).
 */
const MIN_INVESTMENT_PERIOD = 180

/**
 * (LendingProtocolV1_1) Exclusive upper bound, in seconds, on a close-ended vault's
 * investment period (30 Gregorian years).
 */
const MAX_INVESTMENT_PERIOD = 946708560

/**
 * Enum representing withdrawal strategies for a Vault.
 */
export enum VaultWithdrawalPolicy {
  vaultStrategyFirstComeFirstServe = 0x0001,
}

/**
 * Enum representing the kind of a Vault (LendingProtocolV1_1, close-ended vaults).
 */
export enum VaultKind {
  /** An open-ended vault: shares can be redeemed at any time. */
  vaultKindOpen = 0,
  /**
   * A close-ended vault: deposits and redemptions are restricted to the
   * subscription and redemption periods respectively.
   */
  vaultKindClosed = 1,
  /**
   * (VaultContinuousAccrual) A rolling vault: deposits and redemptions are
   * accepted only inside a dealing window that opens at `SubscriptionDate` and
   * reopens every `DealingInterval` seconds for `DealingWindow` seconds.
   */
  vaultKindRolling = 2,
}

/**
 * Enum representing how a Vault recognizes loan interest
 * (VaultContinuousAccrual). The legacy method (0) is never accepted on a new vault.
 */
export enum VaultAccountingMethod {
  /** Interest is recognized as it is collected. */
  vaultAccountingCash = 1,
  /** Interest is recognized continuously as it is earned. */
  vaultAccountingAccrual = 2,
}

/**
 * Enum representing values of {@link VaultCreate} transaction flags.
 *
 * @category Transaction Flags
 */
export enum VaultCreateFlags {
  tfVaultPrivate = 0x00010000,
  tfVaultShareNonTransferable = 0x00020000,
}

/**
 * Map of flags to boolean values representing {@link VaultCreate} transaction
 * flags.
 *
 * @category Transaction Flags
 */
export interface VaultCreateFlagsInterface extends GlobalFlagsInterface {
  tfVaultPrivate?: boolean
  tfVaultShareNonTransferable?: boolean
}

/**
 * The VaultCreate transaction creates a new Vault object.
 *
 * @category Transaction Models
 */
export interface VaultCreate extends BaseTransaction {
  TransactionType: 'VaultCreate'

  /**
   * The asset (XRP, IOU or MPT) of the Vault.
   */
  Asset: Currency

  /**
   * Arbitrary Vault metadata, limited to 256 bytes.
   */
  Data?: string

  /**
   * The maximum asset amount that can be held in a vault.
   */
  AssetsMaximum?: XRPLNumber

  /**
   * Should follow {@link https://github.com/XRPLF/XRPL-Standards/tree/master/XLS-0089-multi-purpose-token-metadata-schema | XLS-89} standard.
   * Use {@link encodeMPTokenMetadata} utility function to convert to convert {@link MPTokenMetadata} to a blob.
   * Use {@link decodeMPTokenMetadata} utility function to convert from a blob to {@link MPTokenMetadata}.
   *
   * While adherence to the XLS-89d format is not mandatory, non-compliant metadata
   * may not be discoverable by ecosystem tools such as explorers and indexers.
   */
  MPTokenMetadata?: string

  /**
   * Indicates the withdrawal strategy used by the Vault.
   */
  WithdrawalPolicy?: number

  /**
   * The PermissionedDomain object ID associated with the shares of this Vault.
   */
  DomainID?: string

  /**
   * The scaling factor for vault shares. Only applicable for IOU assets.
   * Valid values are between 0 and 18 inclusive. For XRP and MPT, this must not be provided.
   */
  Scale?: number

  /**
   * (LendingProtocolV1_1) The kind of Vault: 0 for an open-ended vault (the default), 1
   * for a close-ended vault or 2 for a rolling vault (VaultContinuousAccrual). Can only be
   * set at Vault creation. See {@link VaultKind}.
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
   * (VaultContinuousAccrual, rolling vaults only) The number of seconds between the
   * openings of consecutive dealing windows. Required on a rolling vault.
   */
  DealingInterval?: number

  /**
   * (VaultContinuousAccrual, rolling vaults only) The number of seconds each dealing
   * window stays open. Must be greater than 0 and less than `DealingInterval`.
   */
  DealingWindow?: number

  /**
   * (VaultContinuousAccrual) The fee taken from each deposit, in units of 1/10 basis
   * point, between 0 and 50000 inclusive. The fee stays in the vault.
   */
  DepositFee?: number

  /**
   * (VaultContinuousAccrual) The fee taken from each redemption, in units of 1/10 basis
   * point, between 0 and 50000 inclusive. The fee stays in the vault.
   */
  RedemptionFee?: number

  /**
   * (VaultContinuousAccrual) The number of seconds after a holder's latest deposit during
   * which the `RedemptionFee` applies to that holder. Requires `RedemptionFee`.
   */
  RedemptionPeriod?: number

  /**
   * (VaultContinuousAccrual) How the vault recognizes loan interest: 1 for cash or 2 for
   * accrual. See {@link VaultAccountingMethod}. Fixed at Vault creation.
   */
  AccountingMethod?: number
}

/* eslint-disable max-lines-per-function -- Not needed to reduce function */
/* eslint-disable max-statements -- required to do all field validations */
/**
 * Verify the form and type of an {@link VaultCreate} at runtime.
 *
 * @param tx - A {@link VaultCreate} Transaction.
 * @throws When the {@link VaultCreate} is malformed.
 */
export function validateVaultCreate(tx: Record<string, unknown>): void {
  validateBaseTransaction(tx)

  validateRequiredField(tx, 'Asset', isCurrency)
  validateOptionalField(tx, 'Data', isString)
  validateOptionalField(tx, 'AssetsMaximum', isXRPLNumber)
  validateOptionalField(tx, 'MPTokenMetadata', isString)
  validateOptionalField(tx, 'WithdrawalPolicy', isNumber)
  validateOptionalField(tx, 'DomainID', isHexString)
  validateOptionalField(tx, 'Scale', isNumber)
  validateOptionalField(tx, 'VaultKind', isNumber)
  validateOptionalField(tx, 'SubscriptionDate', isNumber)
  validateOptionalField(tx, 'RedemptionDate', isNumber)
  validateOptionalField(tx, 'DealingInterval', isNumber)
  validateOptionalField(tx, 'DealingWindow', isNumber)
  validateOptionalField(tx, 'DepositFee', isNumber)
  validateOptionalField(tx, 'RedemptionFee', isNumber)
  validateOptionalField(tx, 'RedemptionPeriod', isNumber)
  validateOptionalField(tx, 'AccountingMethod', isNumber)

  // `isNumber` accepts any JavaScript number, so guard against unsupported
  // VaultKind values and non-finite dates (e.g. NaN) that would otherwise slip
  // past the vault-kind branching below.
  if (
    tx.VaultKind !== undefined &&
    tx.VaultKind !== VaultKind.vaultKindOpen &&
    tx.VaultKind !== VaultKind.vaultKindClosed &&
    tx.VaultKind !== VaultKind.vaultKindRolling
  ) {
    throw new ValidationError(
      `VaultCreate: VaultKind must be ${VaultKind.vaultKindOpen} (open-ended), ${VaultKind.vaultKindClosed} (close-ended) or ${VaultKind.vaultKindRolling} (rolling)`,
    )
  }

  if (
    tx.SubscriptionDate !== undefined &&
    !Number.isInteger(tx.SubscriptionDate)
  ) {
    throw new ValidationError(
      'VaultCreate: SubscriptionDate must be an integer number of seconds since the Ripple Epoch',
    )
  }

  if (tx.RedemptionDate !== undefined && !Number.isInteger(tx.RedemptionDate)) {
    throw new ValidationError(
      'VaultCreate: RedemptionDate must be an integer number of seconds since the Ripple Epoch',
    )
  }

  if (tx.Data !== undefined) {
    const dataHex = tx.Data
    // `isHex` accepts odd-length strings, which are not valid byte blobs and
    // fail to serialize, so require an even number of hex characters.
    if (!isHex(dataHex) || dataHex.length % 2 !== 0) {
      throw new ValidationError(
        'VaultCreate: Data must be a hex string with an even number of characters',
      )
    }
    const dataByteLength = dataHex.length / 2
    if (dataByteLength > VAULT_DATA_MAX_BYTE_LENGTH) {
      throw new ValidationError(
        `VaultCreate: Data exceeds ${VAULT_DATA_MAX_BYTE_LENGTH} bytes (actual: ${dataByteLength})`,
      )
    }
  }

  if (tx.MPTokenMetadata !== undefined) {
    const metaHex = tx.MPTokenMetadata
    if (!isHex(metaHex)) {
      throw new ValidationError(
        'VaultCreate: MPTokenMetadata must be a valid non-empty hex string',
      )
    }
    const metaByteLength = metaHex.length / 2
    if (metaByteLength > MAX_MPT_META_BYTE_LENGTH) {
      throw new ValidationError(
        `VaultCreate: MPTokenMetadata exceeds ${MAX_MPT_META_BYTE_LENGTH} bytes (actual: ${metaByteLength})`,
      )
    }
  }

  // If DomainID present, tfVaultPrivate must be set
  if (
    tx.DomainID !== undefined &&
    !hasFlag(tx, VaultCreateFlags.tfVaultPrivate, 'tfVaultPrivate')
  ) {
    throw new ValidationError(
      'VaultCreate: Cannot set DomainID unless tfVaultPrivate flag is set.',
    )
  }

  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- required to check asset type
  const asset = tx.Asset as unknown as Record<string, unknown>
  const isXRP = asset.currency === 'XRP'
  const isMPT = 'mpt_issuance_id' in asset
  const isIOU = !isXRP && !isMPT

  if (tx.Scale !== undefined) {
    // Scale must not be provided for XRP or MPT assets
    if (isXRP || isMPT) {
      throw new ValidationError(
        'VaultCreate: Scale parameter must not be provided for XRP or MPT assets',
      )
    }

    // For IOU assets, Scale must be between 0 and 18 inclusive
    if (isIOU) {
      if (!Number.isInteger(tx.Scale) || tx.Scale < 0 || tx.Scale > MAX_SCALE) {
        throw new ValidationError(
          `VaultCreate: Scale must be a number between 0 and ${MAX_SCALE} inclusive for IOU assets`,
        )
      }
    }
  }

  validateClosedEndedVault(tx)
  validateRollingVault(tx)
  validateAccountingMethod(tx)
  validateRedemptionPeriod(tx)
  validateVaultFees(tx)

  if (tx.MPTokenMetadata != null) {
    const validationMessages = validateMPTokenMetadata(tx.MPTokenMetadata)

    if (validationMessages.length > 0) {
      const message = [
        MPT_META_WARNING_HEADER,
        ...validationMessages.map((msg) => `- ${msg}`),
      ].join('\n')

      // eslint-disable-next-line no-console -- Required here.
      console.warn(message)
    }
  }
}
/* eslint-enable max-lines-per-function */
/* eslint-enable max-statements */

/**
 * Check the date rules of open-ended and close-ended vaults: an open-ended vault
 * carries neither date, and a close-ended vault carries both with an investment
 * period inside [MIN_INVESTMENT_PERIOD, MAX_INVESTMENT_PERIOD).
 *
 * @param tx - A {@link VaultCreate} Transaction.
 * @throws When a date rule is broken.
 */
function validateClosedEndedVault(tx: Record<string, unknown>): void {
  const isClosedEnded = tx.VaultKind === VaultKind.vaultKindClosed
  const isRolling = tx.VaultKind === VaultKind.vaultKindRolling
  if (
    !isClosedEnded &&
    !isRolling &&
    (tx.SubscriptionDate !== undefined || tx.RedemptionDate !== undefined)
  ) {
    throw new ValidationError(
      'VaultCreate: SubscriptionDate and RedemptionDate cannot be set on an open-ended vault',
    )
  }
  if (!isClosedEnded) {
    return
  }
  if (
    typeof tx.SubscriptionDate !== 'number' ||
    typeof tx.RedemptionDate !== 'number'
  ) {
    throw new ValidationError(
      'VaultCreate: A close-ended vault requires both SubscriptionDate and RedemptionDate',
    )
  }
  const investmentPeriod = tx.RedemptionDate - tx.SubscriptionDate
  if (
    investmentPeriod < MIN_INVESTMENT_PERIOD ||
    investmentPeriod >= MAX_INVESTMENT_PERIOD
  ) {
    throw new ValidationError(
      `VaultCreate: RedemptionDate - SubscriptionDate must be within [${MIN_INVESTMENT_PERIOD}, ${MAX_INVESTMENT_PERIOD}) seconds`,
    )
  }
}

/**
 * Check the rolling vault rules (VaultContinuousAccrual): only a rolling vault
 * carries DealingInterval and DealingWindow; a rolling vault requires
 * SubscriptionDate, DealingInterval and DealingWindow, forbids RedemptionDate,
 * and its DealingWindow is greater than 0 and less than DealingInterval.
 *
 * @param tx - A {@link VaultCreate} Transaction.
 * @throws When a rolling vault rule is broken.
 */
function validateRollingVault(tx: Record<string, unknown>): void {
  const isRolling = tx.VaultKind === VaultKind.vaultKindRolling
  if (!isRolling) {
    if (tx.DealingInterval !== undefined || tx.DealingWindow !== undefined) {
      throw new ValidationError(
        `VaultCreate: DealingInterval and DealingWindow can only be set on a rolling vault (VaultKind=${VaultKind.vaultKindRolling})`,
      )
    }
    return
  }
  if (
    tx.SubscriptionDate === undefined ||
    typeof tx.DealingInterval !== 'number' ||
    typeof tx.DealingWindow !== 'number'
  ) {
    throw new ValidationError(
      'VaultCreate: A rolling vault requires SubscriptionDate, DealingInterval and DealingWindow',
    )
  }
  if (tx.RedemptionDate !== undefined) {
    throw new ValidationError(
      'VaultCreate: RedemptionDate cannot be set on a rolling vault',
    )
  }
  if (tx.DealingWindow <= 0 || tx.DealingWindow >= tx.DealingInterval) {
    throw new ValidationError(
      'VaultCreate: DealingWindow must be greater than 0 and less than DealingInterval',
    )
  }
}

/**
 * Check that AccountingMethod, when present, is cash or accrual; the legacy
 * method is never assigned to a new vault.
 *
 * @param tx - A {@link VaultCreate} Transaction.
 * @throws When AccountingMethod is not 1 or 2.
 */
function validateAccountingMethod(tx: Record<string, unknown>): void {
  if (
    tx.AccountingMethod !== undefined &&
    tx.AccountingMethod !== VaultAccountingMethod.vaultAccountingCash &&
    tx.AccountingMethod !== VaultAccountingMethod.vaultAccountingAccrual
  ) {
    throw new ValidationError(
      `VaultCreate: AccountingMethod must be ${VaultAccountingMethod.vaultAccountingCash} (cash) or ${VaultAccountingMethod.vaultAccountingAccrual} (accrual)`,
    )
  }
}
