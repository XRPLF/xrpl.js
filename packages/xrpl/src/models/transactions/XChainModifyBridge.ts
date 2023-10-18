import { Amount, XChainBridge } from '../common'

import { BaseTransaction, isAmount, isXChainBridge, validateBaseTransaction, validateOptionalField, validateRequiredField } from './common'

/**
 * @category Transaction Models
 */
export interface XChainModifyBridge extends BaseTransaction {
  TransactionType: 'XChainModifyBridge'

  MinAccountCreateAmount?: Amount

  SignatureReward?: Amount

  XChainBridge: XChainBridge

}

/**
 * Verify the form and type of a XChainModifyBridge at runtime.
 *
 * @param tx - A XChainModifyBridge Transaction.
 * @throws When the XChainModifyBridge is malformed.
 */
export function validateXChainModifyBridge(tx: Record<string, unknown>): void {
  validateBaseTransaction(tx)

  validateOptionalField(tx, 'MinAccountCreateAmount', isAmount)

  validateOptionalField(tx, 'SignatureReward', isAmount)

  validateRequiredField(tx, 'XChainBridge', isXChainBridge)
}
