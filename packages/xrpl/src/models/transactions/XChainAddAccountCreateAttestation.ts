import { ValidationError } from '../../errors'
import { Amount, XChainBridge } from '../common'

import { BaseTransaction, validateBaseTransaction } from './common'

/**
 *
 * @category Transaction Models
 */
export interface XChainAddAccountCreateAttestation extends BaseTransaction {
  TransactionType: 'XChainAddAccountCreateAttestation'

  Account: string

  Amount: Amount

  AttestationRewardAccount: string

  Destination: string

  OtherChainSource: string

  PublicKey: string

  Signature: string

  SignatureReward: Amount

  WasLockingChainSend: 0 | 1

  XChainAccountCreateCount: string

  XChainBridge: XChainBridge
}

/**
 * Verify the form and type of a XChainAddAccountCreateAttestation at runtime.
 *
 * @param tx - A XChainAddAccountCreateAttestation Transaction.
 * @throws When the XChainAddAccountCreateAttestation is malformed.
 */
export function validateXChainAddAccountCreateAttestation(
  tx: Record<string, unknown>,
): void {
  validateBaseTransaction(tx)

  if (tx.XChainAttestationBatch == null) {
    throw new ValidationError(
      'XChainAddAccountCreateAttestation: missing field XChainAttestationBatch',
    )
  }

  if (typeof tx.XChainAttestationBatch !== 'object') {
    throw new ValidationError(
      'XChainAddAccountCreateAttestation: XChainAttestationBatch must be an object',
    )
  }

  /* eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- known to be this */
  const attestationBatch = tx.XChainAttestationBatch as Record<string, unknown>

  if (attestationBatch.XChainBridge == null) {
    throw new ValidationError(
      'XChainAddAccountCreateAttestation: missing field XChainAttestationBatch.XChainBridge',
    )
  }

  if (attestationBatch.XChainClaimAttestationBatch == null) {
    throw new ValidationError(
      'XChainAddAccountCreateAttestation: missing field XChainAttestationBatch.XChainClaimAttestationBatch',
    )
  }

  if (attestationBatch.XChainCreateAccountAttestationBatch == null) {
    throw new ValidationError(
      'XChainAddAccountCreateAttestation: missing field XChainAttestationBatch.XChainCreateAccountAttestationBatch',
    )
  }
}
