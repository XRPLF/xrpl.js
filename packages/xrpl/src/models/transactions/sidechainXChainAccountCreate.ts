import { ValidationError } from '../../errors'
import { Amount, XChainBridge } from '../common'

import { BaseTransaction, validateBaseTransaction } from './common'

/**
 *
 * @category Transaction Models
 */
export interface SidechainXChainAccountCreate extends BaseTransaction {
  TransactionType: 'SidechainXChainAccountCreate'

  XChainBridge: XChainBridge

  SignatureReward: number | string

  Destination: string

  Amount: Amount
}

/**
 * Verify the form and type of a SidechainXChainAccountCreate at runtime.
 *
 * @param tx - A SidechainXChainAccountCreate Transaction.
 * @throws When the SidechainXChainAccountCreate is malformed.
 */
export function validateSidechainXChainAccountCreate(
  tx: Record<string, unknown>,
): void {
  validateBaseTransaction(tx)

  if (tx.XChainBridge == null) {
    throw new ValidationError(
      'SidechainXChainAccountCreate: missing field XChainBridge',
    )
  }

  if (tx.SignatureReward == null) {
    throw new ValidationError(
      'SidechainXChainAccountCreate: missing field SignatureReward',
    )
  }

  if (tx.Destination == null) {
    throw new ValidationError(
      'SidechainXChainAccountCreate: missing field Destination',
    )
  }

  if (tx.Amount == null) {
    throw new ValidationError(
      'SidechainXChainAccountCreate: missing field Amount',
    )
  }
}
