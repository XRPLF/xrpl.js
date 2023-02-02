import { ValidationError } from '../../errors'
import { Amount, XChainBridge } from '../common'

import { BaseTransaction, validateBaseTransaction } from './common'

/**
 *
 * @category Transaction Models
 */
export interface XChainAddClaimAttestation extends BaseTransaction {
  TransactionType: 'XChainAddClaimAttestation'

  Account: string

  Amount: Amount

  AttestationRewardAccount: string

  Destination?: string

  PublicKey: string

  Signature: string

  WasLockingChainSend: 0 | 1

  XChainBridge: XChainBridge

  XChainClaimID: string
}

/**
 * Verify the form and type of a XChainAddClaimAttestation at runtime.
 *
 * @param tx - A XChainAddClaimAttestation Transaction.
 * @throws When the XChainAddClaimAttestation is malformed.
 */
export function validateXChainAddClaimAttestation(
  tx: Record<string, unknown>,
): void {
  validateBaseTransaction(tx)

  if (tx.XChainBridge == null) {
    throw new ValidationError(
      'XChainAddClaimAttestation: missing field tx.XChainBridge',
    )
  }
}
