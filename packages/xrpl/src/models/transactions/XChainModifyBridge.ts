import { ValidationError } from '../../errors'
import { Amount, XChainBridge } from '../common'

import {
  BaseTransaction,
  GlobalFlags,
  isAmount,
  isXChainBridge,
  validateBaseTransaction,
} from './common'

export enum XChainModifyBridgeFlags {
  tfClearAccountCreateAmount = 0x00010000,
}

export interface XChainModifyBridgeFlagsInterface extends GlobalFlags {
  tfClearAccountCreateAmount?: boolean
}

/**
 *
 * @category Transaction Models
 */
export interface XChainModifyBridge extends BaseTransaction {
  TransactionType: 'XChainModifyBridge'

  XChainBridge: XChainBridge

  SignatureReward?: Amount

  MinAccountCreateAmount?: Amount

  Flags?: number | XChainModifyBridgeFlagsInterface
}

/**
 * Verify the form and type of a XChainModifyBridge at runtime.
 *
 * @param tx - A XChainModifyBridge Transaction.
 * @throws When the XChainModifyBridge is malformed.
 */
export function validateXChainModifyBridge(tx: Record<string, unknown>): void {
  validateBaseTransaction(tx)

  if (tx.XChainBridge == null) {
    throw new ValidationError('XChainModifyBridge: missing field XChainBridge')
  }

  if (!isXChainBridge(tx.XChainBridge)) {
    throw new ValidationError('XChainModifyBridge: invalid field XChainBridge')
  }

  if (tx.SignatureReward !== undefined && !isAmount(tx.SignatureReward)) {
    throw new ValidationError(
      'XChainModifyBridge: invalid field SignatureReward',
    )
  }

  if (
    tx.MinAccountCreateAmount !== undefined &&
    !isAmount(tx.MinAccountCreateAmount)
  ) {
    throw new ValidationError(
      'XChainModifyBridge: invalid field MinAccountCreateAmount',
    )
  }
}
