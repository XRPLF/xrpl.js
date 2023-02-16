import { ValidationError } from '../../errors'
import { Amount, XChainBridge } from '../common'

import {
  BaseTransaction,
  isAmount,
  isXChainBridge,
  validateBaseTransaction,
} from './common'

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
// eslint-disable-next-line max-lines-per-function, max-statements, complexity -- okay for this function, lots of things to check
export function validateXChainAddAccountCreateAttestation(
  tx: Record<string, unknown>,
): void {
  validateBaseTransaction(tx)

  if (tx.Amount == null) {
    throw new ValidationError(
      'XChainAddAccountCreateAttestation: missing field Amount',
    )
  }

  if (!isAmount(tx.Amount)) {
    throw new ValidationError(
      'XChainAddAccountCreateAttestation: invalid field Amount',
    )
  }

  if (tx.AttestationRewardAccount == null) {
    throw new ValidationError(
      'XChainAddAccountCreateAttestation: missing field AttestationRewardAccount',
    )
  }

  if (typeof tx.AttestationRewardAccount !== 'string') {
    throw new ValidationError(
      'XChainAddAccountCreateAttestation: invalid field AttestationRewardAccount',
    )
  }

  if (tx.AttestationSignerAccount == null) {
    throw new ValidationError(
      'XChainAddAccountCreateAttestation: missing field AttestationSignerAccount',
    )
  }

  if (typeof tx.AttestationSignerAccount !== 'string') {
    throw new ValidationError(
      'XChainAddAccountCreateAttestation: invalid field AttestationSignerAccount',
    )
  }

  if (tx.Destination == null) {
    throw new ValidationError(
      'XChainAddAccountCreateAttestation: missing field Destination',
    )
  }

  if (typeof tx.Destination !== 'string') {
    throw new ValidationError(
      'XChainAddAccountCreateAttestation: invalid field Destination',
    )
  }

  if (tx.OtherChainSource == null) {
    throw new ValidationError(
      'XChainAddAccountCreateAttestation: missing field OtherChainSource',
    )
  }

  if (typeof tx.OtherChainSource !== 'string') {
    throw new ValidationError(
      'XChainAddAccountCreateAttestation: invalid field OtherChainSource',
    )
  }

  if (tx.PublicKey == null) {
    throw new ValidationError(
      'XChainAddAccountCreateAttestation: missing field PublicKey',
    )
  }

  if (typeof tx.PublicKey !== 'string') {
    throw new ValidationError(
      'XChainAddAccountCreateAttestation: invalid field PublicKey',
    )
  }

  if (tx.Signature == null) {
    throw new ValidationError(
      'XChainAddAccountCreateAttestation: missing field Signature',
    )
  }

  if (typeof tx.Signature !== 'string') {
    throw new ValidationError(
      'XChainAddAccountCreateAttestation: invalid field Signature',
    )
  }

  if (tx.SignatureReward == null) {
    throw new ValidationError(
      'XChainAddAccountCreateAttestation: missing field SignatureReward',
    )
  }

  if (!isAmount(tx.SignatureReward)) {
    throw new ValidationError(
      'XChainAddAccountCreateAttestation: invalid field SignatureReward',
    )
  }

  if (tx.WasLockingChainSend == null) {
    throw new ValidationError(
      'XChainAddAccountCreateAttestation: missing field WasLockingChainSend',
    )
  }

  if (tx.WasLockingChainSend !== 0 && tx.WasLockingChainSend !== 1) {
    throw new ValidationError(
      'XChainAddAccountCreateAttestation: invalid field WasLockingChainSend',
    )
  }

  if (tx.XChainAccountCreateCount == null) {
    throw new ValidationError(
      'XChainAddAccountCreateAttestation: missing field XChainAccountCreateCount',
    )
  }

  if (typeof tx.XChainAccountCreateCount !== 'string') {
    throw new ValidationError(
      'XChainAddAccountCreateAttestation: invalid field XChainAccountCreateCount',
    )
  }

  if (tx.XChainBridge == null) {
    throw new ValidationError(
      'XChainAddAccountCreateAttestation: missing field XChainBridge',
    )
  }

  if (!isXChainBridge(tx.XChainBridge)) {
    throw new ValidationError(
      'XChainAddAccountCreateAttestation: invalid field XChainBridge',
    )
  }
}
