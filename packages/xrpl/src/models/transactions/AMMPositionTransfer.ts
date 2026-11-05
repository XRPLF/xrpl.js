import { ValidationError } from '../../errors'

import {
  Account,
  BaseTransaction,
  isAccount,
  isLedgerEntryId,
  validateBaseTransaction,
  validateRequiredField,
} from './common'

/**
 * (AMMCurves) Transfer a concentrated liquidity position (an AMMPosition)
 * to another account. The destination consents by preauthorizing the sender
 * with a DepositPreauth.
 *
 * @category Transaction Models
 */
export interface AMMPositionTransfer extends BaseTransaction {
  TransactionType: 'AMMPositionTransfer'

  /**
   * The account that receives the position. Must differ from `Account`.
   */
  Destination: Account

  /**
   * The ledger entry ID of the position to transfer. The sender must own it.
   */
  PositionID: string
}

/**
 * Verify the form and type of an {@link AMMPositionTransfer} at runtime.
 *
 * @param tx - An {@link AMMPositionTransfer} Transaction.
 * @throws When the {@link AMMPositionTransfer} is malformed.
 */
export function validateAMMPositionTransfer(tx: Record<string, unknown>): void {
  validateBaseTransaction(tx)

  validateRequiredField(tx, 'Destination', isAccount)
  validateRequiredField(tx, 'PositionID', isLedgerEntryId)

  if (tx.Destination === tx.Account) {
    throw new ValidationError(
      'AMMPositionTransfer: Destination and Account must be different',
    )
  }
}
