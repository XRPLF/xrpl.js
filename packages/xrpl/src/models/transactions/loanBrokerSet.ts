import BigNumber from 'bignumber.js'

import { ValidationError } from '../../errors'
import { hasFlag } from '../utils'

import {
  BaseTransaction,
  GlobalFlagsInterface,
  validateHexMetadata,
  isLedgerEntryId,
  isNumber,
  isXRPLNumber,
  validateBaseTransaction,
  validateOptionalField,
  isString,
  validateRequiredField,
  XRPLNumber,
} from './common'

const MAX_DATA_LENGTH = 512
const MAX_MANAGEMENT_FEE_RATE = 10000
const MAX_COVER_RATE_MINIMUM = 100000
const MAX_COVER_RATE_LIQUIDATION = 100000
// A ledger entry ID of all zeros
const ZERO_ID = /^0+$/u

/**
 * Enum representing values of {@link LoanBrokerSet} transaction flags.
 *
 * @category Transaction Flags
 */
export enum LoanBrokerSetFlags {
  /**
   * Create a private LoanBroker, whose borrowers must hold a credential of
   * its DomainID. Only on creation.
   */
  tfLoanBrokerPrivate = 0x00010000,
}

/**
 * Map of flags to boolean values representing {@link LoanBrokerSet}
 * transaction flags.
 *
 * @category Transaction Flags
 */
export interface LoanBrokerSetFlagsInterface extends GlobalFlagsInterface {
  tfLoanBrokerPrivate?: boolean
}

/**
 * The transaction creates a new LoanBroker object or updates an existing one.
 *
 * @category Transaction Models
 */
export interface LoanBrokerSet extends BaseTransaction {
  TransactionType: 'LoanBrokerSet'

  Flags?: number | LoanBrokerSetFlagsInterface

  /**
   * The Vault ID that the Lending Protocol will use to access liquidity.
   */
  VaultID: string

  /**
   * The Loan Broker ID that the transaction is modifying.
   */
  LoanBrokerID?: string

  /**
   * Arbitrary metadata in hex format. The field is limited to 512 characters.
   */
  Data?: string

  /**
   * The 1/10th basis point fee charged by the Lending Protocol Owner. Valid values are between 0 and 10000 inclusive (1% - 10%).
   */
  ManagementFeeRate?: number

  /**
   * The maximum amount the protocol can owe the Vault.
   * The default value of 0 means there is no limit to the debt. Must not be negative.
   */
  DebtMaximum?: XRPLNumber

  /**
   * The 1/10th basis point DebtTotal that the first loss capital must cover. Valid values are between 0 and 100000 inclusive.
   */
  CoverRateMinimum?: number

  /**
   * The 1/10th basis point of minimum required first loss capital liquidated to cover a Loan default.
   * Valid values are between 0 and 100000 inclusive.
   */
  CoverRateLiquidation?: number

  /**
   * The ID of the PermissionedDomain whose credentials a private LoanBroker's
   * borrowers must hold. On creation, requires tfLoanBrokerPrivate.
   */
  DomainID?: string
}

/**
 * Verify tfLoanBrokerPrivate and DomainID: the flag only on creation, a
 * DomainID on creation only with the flag, and a DomainID never zero.
 *
 * @param tx - LoanBrokerSet Transaction.
 * @throws When the flag or DomainID is misused.
 */
function validatePrivateLoanBroker(tx: Record<string, unknown>): void {
  const isPrivate = hasFlag(
    tx,
    LoanBrokerSetFlags.tfLoanBrokerPrivate,
    'tfLoanBrokerPrivate',
  )

  if (tx.LoanBrokerID != null && isPrivate) {
    throw new ValidationError(
      'LoanBrokerSet: tfLoanBrokerPrivate cannot be set on an existing LoanBroker',
    )
  }

  if (tx.DomainID == null) {
    return
  }

  if (!isLedgerEntryId(tx.DomainID)) {
    throw new ValidationError(
      'LoanBrokerSet: DomainID must be 64 characters hexadecimal string',
    )
  }

  if (ZERO_ID.test(tx.DomainID)) {
    throw new ValidationError('LoanBrokerSet: DomainID must not be zero')
  }

  if (tx.LoanBrokerID == null && !isPrivate) {
    throw new ValidationError(
      'LoanBrokerSet: DomainID requires tfLoanBrokerPrivate',
    )
  }
}

/**
 * Verify the form and type of an LoanBrokerSet at runtime.
 *
 * @param tx - LoanBrokerSet Transaction.
 * @throws When LoanBrokerSet is Malformed.
 */
// eslint-disable-next-line max-statements, max-lines-per-function -- due to exhaustive validations
export function validateLoanBrokerSet(tx: Record<string, unknown>): void {
  validateBaseTransaction(tx)

  validateRequiredField(tx, 'VaultID', isString)
  validateOptionalField(tx, 'LoanBrokerID', isString)
  validateOptionalField(tx, 'Data', isString)
  validateOptionalField(tx, 'ManagementFeeRate', isNumber)
  validateOptionalField(tx, 'DebtMaximum', isXRPLNumber)
  validateOptionalField(tx, 'CoverRateMinimum', isNumber)
  validateOptionalField(tx, 'CoverRateLiquidation', isNumber)
  validateOptionalField(tx, 'DomainID', isString)

  if (!isLedgerEntryId(tx.VaultID)) {
    throw new ValidationError(
      `LoanBrokerSet: VaultID must be 64 characters hexadecimal string`,
    )
  }

  if (tx.LoanBrokerID != null && !isLedgerEntryId(tx.LoanBrokerID)) {
    throw new ValidationError(
      `LoanBrokerSet: LoanBrokerID must be 64 characters hexadecimal string`,
    )
  }

  if (tx.Data != null && !validateHexMetadata(tx.Data, MAX_DATA_LENGTH)) {
    throw new ValidationError(
      `LoanBrokerSet: Data must be a valid non-empty hex string up to ${MAX_DATA_LENGTH} characters`,
    )
  }

  if (
    tx.ManagementFeeRate != null &&
    (tx.ManagementFeeRate < 0 || tx.ManagementFeeRate > MAX_MANAGEMENT_FEE_RATE)
  ) {
    throw new ValidationError(
      `LoanBrokerSet: ManagementFeeRate must be between 0 and ${MAX_MANAGEMENT_FEE_RATE} inclusive`,
    )
  }

  if (tx.DebtMaximum != null && new BigNumber(tx.DebtMaximum).isLessThan(0)) {
    throw new ValidationError(
      'LoanBrokerSet: DebtMaximum must be a non-negative value',
    )
  }

  if (
    tx.CoverRateMinimum != null &&
    (tx.CoverRateMinimum < 0 || tx.CoverRateMinimum > MAX_COVER_RATE_MINIMUM)
  ) {
    throw new ValidationError(
      `LoanBrokerSet: CoverRateMinimum must be between 0 and ${MAX_COVER_RATE_MINIMUM} inclusive`,
    )
  }

  if (
    tx.CoverRateLiquidation != null &&
    (tx.CoverRateLiquidation < 0 ||
      tx.CoverRateLiquidation > MAX_COVER_RATE_LIQUIDATION)
  ) {
    throw new ValidationError(
      `LoanBrokerSet: CoverRateLiquidation must be between 0 and ${MAX_COVER_RATE_LIQUIDATION} inclusive`,
    )
  }

  // Validate that either both CoverRateMinimum and CoverRateLiquidation are zero,
  // or both are non-zero.
  const coverRateMinimumValue = tx.CoverRateMinimum ?? 0
  const coverRateLiquidationValue = tx.CoverRateLiquidation ?? 0

  if (
    (coverRateMinimumValue === 0 && coverRateLiquidationValue !== 0) ||
    (coverRateMinimumValue !== 0 && coverRateLiquidationValue === 0)
  ) {
    throw new ValidationError(
      'LoanBrokerSet: CoverRateMinimum and CoverRateLiquidation must both be zero or both be non-zero',
    )
  }

  validatePrivateLoanBroker(tx)
}
