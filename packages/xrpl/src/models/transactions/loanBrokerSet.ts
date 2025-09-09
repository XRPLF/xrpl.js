import BigNumber from 'bignumber.js'

import { ValidationError } from '../../errors'

import {
  BaseTransaction,
  getHexMetadataValidator,
  isLedgerEntryId,
  isNumber,
  isXRPLNumber,
  validateBaseTransaction,
  validateOptionalField,
  validateRequiredField,
  XRPLNumber,
} from './common'

const MAX_DATA_LENGTH = 512
const MAX_MANAGEMENT_FEE_RATE = 10000
const MAX_COVER_RATE_MINIMUM = 100000
const MAX_COVER_RATE_LIQUIDATION = 100000

/**
 * The transaction creates a new LoanBroker object or updates an existing one.
 *
 * @category Transaction Models
 */
export interface LoanBrokerSet extends BaseTransaction {
  TransactionType: 'LoanBrokerSet'

  /**
   * The Vault ID that the Lending Protocol will use to access liquidity.
   */
  VaultID: string

  /**
   * The Loan Broker ID that the transaction is modifying.
   */
  LoanBrokerID?: string

  /**
   * Arbitrary metadata in hex format. The field is limited to 256 bytes.
   */
  Data?: string

  /**
   * The 1/10th basis point fee charged by the Lending Protocol Owner. Valid values are between 0 and 10000 inclusive.
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
}

/**
 * Verify the form and type of an LoanBrokerSet at runtime.
 *
 * @param tx - LoanBrokerSet Transaction.
 * @throws When LoanBrokerSet is Malformed.
 */
export function validateLoanBrokerSet(tx: Record<string, unknown>): void {
  validateBaseTransaction(tx)

  validateRequiredField(tx, 'VaultID', isLedgerEntryId)
  validateOptionalField(tx, 'LoanBrokerID', isLedgerEntryId)
  validateOptionalField(tx, 'Data', getHexMetadataValidator(MAX_DATA_LENGTH))
  validateOptionalField(tx, 'ManagementFeeRate', isNumber)
  validateOptionalField(tx, 'DebtMaximum', isXRPLNumber)
  validateOptionalField(tx, 'CoverRateMinimum', isNumber)
  validateOptionalField(tx, 'CoverRateLiquidation', isNumber)

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
}
