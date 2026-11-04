import { ValidationError } from '../../errors'
import { Currency } from '../common'

import {
  BaseTransaction,
  isCurrency,
  isDomainID,
  isLedgerEntryId,
  isNumber,
  validateBaseTransaction,
  validateHexMetadata,
  validateOptionalField,
  validateRequiredField,
} from './common'

/** The largest Data payload, in bytes (rippled `kMaxDataPayloadLength`). */
const PERP_EXCHANGE_DATA_MAX_BYTE_LENGTH = 256

/** The unit of a rate share, in 1/10 basis points. */
const RATE_UNITY = 100000

/** Fields that only an exchange's creation may carry. */
const CREATION_ONLY_FIELDS = [
  'Asset',
  'Scale',
  'DomainID',
  'VaultID',
  'VaultLossWindow',
  'ParameterDelay',
]

/** Rate and count fields, each a UInt32. */
const UINT32_FIELDS = [
  'MakerFee',
  'TakerFee',
  'OwnerFeeShare',
  'VaultFeeShare',
  'BuilderFeeMax',
  'CoverRateMinimum',
  'VaultLossLimit',
  'VaultLossWindow',
  'ParameterDelay',
]

/**
 * The PerpExchangeSet transaction creates a perpetual futures exchange with
 * its collateral pseudo-account, or updates the mutable parameters of one.
 * Creation omits ExchangeID; an update carries it.
 *
 * @category Transaction Models
 */
export interface PerpExchangeSet extends BaseTransaction {
  TransactionType: 'PerpExchangeSet'

  /** Update only: the ID of the PerpExchange ledger entry to change. */
  ExchangeID?: string

  /** Creation only, and required there: the collateral asset. */
  Asset?: Currency

  /** Creation only, IOU collateral only: the collateral scale. */
  Scale?: number

  /** Creation only: the Permissioned Domain every trader must be in. */
  DomainID?: string

  /**
   * Creation only: the backstop Vault, owned by the Account and holding the
   * same Asset; present together with VaultLossWindow.
   */
  VaultID?: string

  /** The fee rate charged to a fill's maker, in 1/10 basis points. */
  MakerFee?: number

  /** The fee rate charged to a fill's taker, in 1/10 basis points. */
  TakerFee?: number

  /** The share of each fee paid to the owner, in 1/10 basis points. */
  OwnerFeeShare?: number

  /** The share of each fee paid to the vault, in 1/10 basis points. */
  VaultFeeShare?: number

  /** The highest builder fee an order may set, in 1/10 basis points. */
  BuilderFeeMax?: number

  /** Cover required per unit of open-interest notional, in 1/10 basis points. */
  CoverRateMinimum?: number

  /**
   * The share of the vault's assets the loss waterfall may draw per window,
   * in 1/10 basis points.
   */
  VaultLossLimit?: number

  /**
   * Creation only: the vault loss window in seconds; present together with
   * VaultID.
   */
  VaultLossWindow?: number

  /**
   * Creation only, and required there: seconds before a loosening change
   * applies.
   */
  ParameterDelay?: number

  /** Operator metadata, hex-encoded, at most 256 bytes. */
  Data?: string
}

/**
 * Whether the input is a non-empty, even-length hex string of at most 256 bytes.
 *
 * @param input - The value to check.
 * @returns Whether the input is valid exchange Data.
 */
function isPerpExchangeData(input: unknown): input is string {
  return (
    validateHexMetadata(input, PERP_EXCHANGE_DATA_MAX_BYTE_LENGTH * 2) &&
    input.length % 2 === 0
  )
}

/**
 * Verify the form and type of a {@link PerpExchangeSet} at runtime.
 *
 * @param tx - A {@link PerpExchangeSet} Transaction.
 * @throws When the {@link PerpExchangeSet} is malformed.
 */
export function validatePerpExchangeSet(tx: Record<string, unknown>): void {
  validateBaseTransaction(tx)
  validateOptionalField(tx, 'ExchangeID', isLedgerEntryId)
  validateOptionalField(tx, 'Asset', isCurrency)
  validateOptionalField(tx, 'Scale', isNumber)
  validateOptionalField(tx, 'DomainID', isDomainID)
  validateOptionalField(tx, 'VaultID', isLedgerEntryId)
  UINT32_FIELDS.forEach((field) => validateOptionalField(tx, field, isNumber))
  validateOptionalField(tx, 'Data', isPerpExchangeData)

  const ownerFeeShare = isNumber(tx.OwnerFeeShare) ? tx.OwnerFeeShare : 0
  const vaultFeeShare = isNumber(tx.VaultFeeShare) ? tx.VaultFeeShare : 0
  if (ownerFeeShare + vaultFeeShare > RATE_UNITY) {
    throw new ValidationError(
      `PerpExchangeSet: OwnerFeeShare plus VaultFeeShare must not exceed ${RATE_UNITY}`,
    )
  }

  if (tx.ExchangeID !== undefined) {
    const fixed = CREATION_ONLY_FIELDS.find((field) => tx[field] !== undefined)
    if (fixed !== undefined) {
      throw new ValidationError(
        `PerpExchangeSet: ${fixed} can only be set on creation`,
      )
    }
    return
  }

  validateRequiredField(tx, 'Asset', isCurrency)
  validateRequiredField(tx, 'ParameterDelay', isNumber)
  if ((tx.VaultID === undefined) !== (tx.VaultLossWindow === undefined)) {
    throw new ValidationError(
      'PerpExchangeSet: VaultID and VaultLossWindow must be present together',
    )
  }
}
