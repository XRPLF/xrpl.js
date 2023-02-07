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

  if (tx.XChainBridge == null) {
    throw new ValidationError(
      'XChainAddAccountCreateAttestation: missing field tx.XChainBridge',
    )
  }
}
