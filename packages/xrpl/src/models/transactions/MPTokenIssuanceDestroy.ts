import {
  BaseTransaction,
  isString,
  validateBaseTransaction,
  validateRequiredField,
} from './common'

/**
 * The MPTokenIssuanceDestroy transaction is used to remove an MPTokenIssuance object
 * from the directory node in which it is being held, effectively removing the token
 * from the ledger. If this operation succeeds, the corresponding
 * MPTokenIssuance is removed and the owner’s reserve requirement is reduced by one.
 * This operation must fail if there are any holders who have non-zero balances.
 */
export interface MPTokenIssuanceDestroy extends BaseTransaction {
  TransactionType: 'MPTokenIssuanceDestroy'
  /**
   * Identifies the MPTokenIssuance object to be removed by the transaction.
   */
  MPTokenIssuanceID: string
}

/**
 * Verify the form and type of an MPTokenIssuanceDestroy at runtime.
 *
 * @param tx - An MPTokenIssuanceDestroy Transaction.
 * @throws When the MPTokenIssuanceDestroy is Malformed.
 */
export function validateMPTokenIssuanceDestroy(
  tx: Record<string, unknown>,
): void {
  validateBaseTransaction(tx)
  validateRequiredField(tx, 'MPTokenIssuanceID', isString)
}
