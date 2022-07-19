import { ValidationError } from '../../errors'
import { Amount, XChainBridge } from '../common'

import { BaseTransaction, validateBaseTransaction } from './common'

/**
 *
 * @category Transaction Models
 */
export interface XChainAddAttestation extends BaseTransaction {
  TransactionType: 'XChainAddAttestation'

  XChainBridge: XChainBridge

  XChainClaimAttestationBatch: {
    XChainClaimAttestationBatchElement: {
      Account: string

      Amount: Amount

      AttestationRewardAccount: string

      Destination: string

      PublicKey: string

      Signature: string

      WasLockingChainSend: 0 | 1

      XChainClaimID: string
    }[]
  }

  XChainCreateAccountAttestationBatch: {}[]
}

/**
 * Verify the form and type of a XChainAddAttestation at runtime.
 *
 * @param tx - A XChainAddAttestation Transaction.
 * @throws When the XChainAddAttestation is malformed.
 */
export function validateXChainAddAttestation(
  tx: Record<string, unknown>,
): void {
  validateBaseTransaction(tx)

  if (tx.XChainBridge == null) {
    throw new ValidationError(
      'XChainAddAttestation: missing field XChainBridge',
    )
  }

  if (tx.XChainClaimAttestationBatch == null) {
    throw new ValidationError(
      'XChainAddAttestation: missing field XChainClaimAttestationBatch',
    )
  }

  if (tx.XChainCreateAccountAttestationBatch == null) {
    throw new ValidationError(
      'XChainAddAttestation: missing field XChainCreateAccountAttestationBatch',
    )
  }
}
