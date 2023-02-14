import { ValidationError } from '../../errors'
import { Amount, XChainBridge } from '../common'

import { BaseTransaction, validateBaseTransaction } from './common'

/**
 *
 * @category Transaction Models
 */
export interface XChainAddAccountCreateAttestation extends BaseTransaction {
  TransactionType: 'XChainAddAccountCreateAttestation'

  Amount: Amount

  AttestationRewardAccount: string

  AttestationSignerAccount: string

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
// eslint-disable-next-line max-lines-per-function, complexity -- needed
export function validateXChainAddAccountCreateAttestation(
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

  if (tx.Destination == null) {
    throw new ValidationError(
      'XChainAddAccountCreateAttestation: missing field tx.Destination',
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

  if (tx.SignatureReward == null) {
    throw new ValidationError(
      'XChainAddAccountCreateAttestation: missing field tx.SignatureReward',
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
}
