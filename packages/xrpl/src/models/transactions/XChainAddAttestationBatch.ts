import { ValidationError } from '../../errors'
import { Amount, XChainBridge } from '../common'

import { BaseTransaction, validateBaseTransaction } from './common'

/**
 *
 * @category Transaction Models
 */
export interface XChainAddAttestationBatch extends BaseTransaction {
  TransactionType: 'XChainAddAttestationBatch'

  XChainAttestationBatch: {
    XChainBridge: XChainBridge

    XChainClaimAttestationBatch: Array<{
      XChainClaimAttestationBatchElement: {
        Account: string

        Amount: Amount

        AttestationRewardAccount: string

        Destination?: string

        PublicKey: string

        Signature: string

        WasLockingChainSend: 0 | 1

        XChainClaimID: string
      }
    }>

    XChainCreateAccountAttestationBatch: Array<{
      XChainCreateAccountAttestationBatchElement: {
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
 * Verify the form and type of a XChainAddAttestationBatch at runtime.
 *
 * @param tx - A XChainAddAttestationBatch Transaction.
 * @throws When the XChainAddAttestationBatch is malformed.
 */
export function validateXChainAddAttestationBatch(
  tx: Record<string, unknown>,
): void {
  validateBaseTransaction(tx)

  if (tx.XChainAttestationBatch == null) {
    throw new ValidationError(
      'XChainAddAttestationBatch: missing field XChainAttestationBatch',
    )
  }

  if (typeof tx.XChainAttestationBatch !== 'object') {
    throw new ValidationError(
      'XChainAddAttestationBatch: XChainAttestationBatch must be an object',
    )
  }

  /* eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- known to be this */
  const attestationBatch = tx.XChainAttestationBatch as Record<string, unknown>

  if (attestationBatch.XChainBridge == null) {
    throw new ValidationError(
      'XChainAddAttestationBatch: missing field XChainAttestationBatch.XChainBridge',
    )
  }

  if (attestationBatch.XChainClaimAttestationBatch == null) {
    throw new ValidationError(
      'XChainAddAttestationBatch: missing field XChainAttestationBatch.XChainClaimAttestationBatch',
    )
  }

  if (attestationBatch.XChainCreateAccountAttestationBatch == null) {
    throw new ValidationError(
      'XChainAddAttestationBatch: missing field XChainAttestationBatch.XChainCreateAccountAttestationBatch',
    )
  }
}
