import {
  BaseTransaction,
  validateBaseTransaction,
  validateFlagsMask,
  validateRequiredField,
} from './common'
import { isCurrencyCode } from './tokenIssuanceCreate'

/**
 * The TokenIssuanceDestroy transaction deletes the issuer's TokenIssuance for
 * a currency once nothing is issued in either representation.
 *
 * @category Transaction Models
 */
export interface TokenIssuanceDestroy extends BaseTransaction {
  TransactionType: 'TokenIssuanceDestroy'

  /** The currency code of the TokenIssuance to delete. */
  Currency: string
}

/**
 * Verify the form and type of a {@link TokenIssuanceDestroy} at runtime.
 *
 * @param tx - A {@link TokenIssuanceDestroy} Transaction.
 * @throws When the {@link TokenIssuanceDestroy} is malformed.
 */
export function validateTokenIssuanceDestroy(
  tx: Record<string, unknown>,
): void {
  validateBaseTransaction(tx)
  validateFlagsMask(tx)
  validateRequiredField(tx, 'Currency', isCurrencyCode)
}
