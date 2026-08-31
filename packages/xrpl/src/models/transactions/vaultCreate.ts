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
  isString,
  VAULT_DATA_MAX_BYTE_LENGTH,
  XRPLNumber,
  isXRPLNumber,
} from './common'

const MAX_SCALE = 18

/**
 * (XLS-587) Minimum length, in seconds, of a close-ended vault's investment
 * period (`RedemptionDate - SubscriptionDate`).
 */
const MIN_INVESTMENT_PERIOD = 60

/**
 * (XLS-587) Exclusive upper bound, in seconds, on a close-ended vault's
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
 * Enum representing the kind of a Vault (XLS-587, close-ended vaults).
 */
export enum VaultKind {
  /** An open-ended vault: shares can be redeemed at any time. */
  vaultKindOpen = 0,
  /**
   * A close-ended vault: deposits and redemptions are restricted to the
   * subscription and redemption periods respectively.
   */
  vaultKindClosed = 1,
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
   * (XLS-587) The kind of Vault: 0 for an open-ended vault (the default) or 1
   * for a close-ended vault. Can only be set at Vault creation. See {@link VaultKind}.
   */
  VaultKind?: number

  /**
   * (XLS-587, close-ended vaults only) The time, in seconds since the Ripple
   * Epoch, up to which deposits into the Vault are accepted.
   */
  SubscriptionDate?: number

  /**
   * (XLS-587, close-ended vaults only) The time, in seconds since the Ripple
   * Epoch, at which shares may begin to be redeemed from the Vault.
   */
  RedemptionDate?: number
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
  validateOptionalField(tx, 'DomainID', isString)
  validateOptionalField(tx, 'Scale', isNumber)
  validateOptionalField(tx, 'VaultKind', isNumber)
  validateOptionalField(tx, 'SubscriptionDate', isNumber)
  validateOptionalField(tx, 'RedemptionDate', isNumber)

  if (tx.Data !== undefined) {
    const dataHex = tx.Data
    if (!isHex(dataHex)) {
      throw new ValidationError('VaultCreate: Data must be a valid hex string')
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

  // XLS-587 close-ended vault rules. A close-ended vault (VaultKind === 1)
  // requires both a subscription and a redemption date; an open-ended vault
  // (the default) must not carry either date.
  const isClosedEnded = tx.VaultKind === VaultKind.vaultKindClosed
  const hasSubscription = tx.SubscriptionDate !== undefined
  const hasRedemption = tx.RedemptionDate !== undefined
  if (isClosedEnded) {
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
  } else if (hasSubscription || hasRedemption) {
    throw new ValidationError(
      'VaultCreate: SubscriptionDate and RedemptionDate can only be set on a close-ended vault (VaultKind=1)',
    )
  }

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
