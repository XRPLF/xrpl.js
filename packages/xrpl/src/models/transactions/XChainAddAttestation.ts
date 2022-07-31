import { ValidationError } from '../../errors'
import { Amount, XChainBridge } from '../common'

import { BaseTransaction, validateBaseTransaction } from './common'

/**
 *
 * @category Transaction Models
 */
export interface XChainAddAttestation extends BaseTransaction {
  TransactionType: 'XChainAddAttestation'

  XChainAttestationBatch: {
    XChainBridge: XChainBridge

    XChainClaimAttestationBatch: Array<{
      XChainClaimAttestationBatchElement: {
        Account: string

        Amount: Amount

        AttestationRewardAccount: string

        Destination: string

        PublicKey: string

        Signature: string

        WasLockingChainSend: 0 | 1

        XChainClaimID: string
      }
    }>

    XChainCreateAccountAttestationBatch: Array<{
      XChainClaimAttestationBatchElement: {
        Account: string

        Amount: Amount

        AttestationRewardAccount: string

        Destination: string

        PublicKey: string

        Signature: string

        WasLockingChainSend: 0 | 1

        XChainAccountCreateCount: string
      }
    }>
  }
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

  if (tx.XChainAttestationBatch == null) {
    throw new ValidationError(
      'XChainAddAttestation: missing field XChainAttestationBatch',
    )
  }

  if (typeof tx.XChainAttestationBatch !== 'object') {
    throw new ValidationError(
      'XChainAddAttestation: XChainAttestationBatch must be an object',
    )
  }

  /* eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- known to be this */
  const attestationBatch = tx.XChainAttestationBatch as Record<string, unknown>

  if (attestationBatch.XChainBridge == null) {
    throw new ValidationError(
      'XChainAddAttestation: missing field XChainAttestationBatch.XChainBridge',
    )
  }

  if (attestationBatch.XChainClaimAttestationBatch == null) {
    throw new ValidationError(
      'XChainAddAttestation: missing field XChainAttestationBatch.XChainClaimAttestationBatch',
    )
  }

  if (attestationBatch.XChainCreateAccountAttestationBatch == null) {
    throw new ValidationError(
      'XChainAddAttestation: missing field XChainAttestationBatch.XChainCreateAccountAttestationBatch',
    )
  }
}
