import { ValidationError } from '../../errors'
import { Amount, XChainBridge } from '../common'

import { BaseTransaction, validateBaseTransaction } from './common'

/**
 *
 * @category Transaction Models
 */
export interface XChainAddClaimAttestation extends BaseTransaction {
  TransactionType: 'XChainAddClaimAttestation'

  Amount: Amount

  AttestationRewardAccount: string

  Destination?: string

  OtherChainSource: string

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

  if (tx.Amount == null) {
    throw new ValidationError(
      'XChainAddAccountCreateAttestation: missing field tx.Amount',
    )
  }

  if (tx.AttestationRewardAccount == null) {
    throw new ValidationError(
      'XChainAddAccountCreateAttestation: missing field tx.AttestationRewardAccount',
    )
  }

  if (tx.Destination != null && typeof tx.Destination !== 'string') {
    throw new ValidationError(
      'XChainAddAccountCreateAttestation: invalid field tx.Destination',
    )
  }

  if (tx.OtherChainSource == null) {
    throw new ValidationError(
      'XChainAddAccountCreateAttestation: missing field tx.OtherChainSource',
    )
  }

  if (tx.PublicKey == null) {
    throw new ValidationError(
      'XChainAddAccountCreateAttestation: missing field tx.PublicKey',
    )
  }

  if (tx.Signature == null) {
    throw new ValidationError(
      'XChainAddAccountCreateAttestation: missing field tx.Signature',
    )
  }

  if (tx.WasLockingChainSend == null) {
    throw new ValidationError(
      'XChainAddAccountCreateAttestation: missing field tx.WasLockingChainSend',
    )
  }

  if (tx.XChainAccountCreateCount == null) {
    throw new ValidationError(
      'XChainAddAccountCreateAttestation: missing field tx.XChainAccountCreateCount',
    )
  }

  if (tx.XChainBridge == null) {
    throw new ValidationError(
      'XChainAddAccountCreateAttestation: missing field tx.XChainBridge',
    )
  }

  if (tx.XChainClaimID == null) {
    throw new ValidationError(
      'XChainAddAccountCreateAttestation: missing field tx.XChainClaimID',
    )
  }
}
