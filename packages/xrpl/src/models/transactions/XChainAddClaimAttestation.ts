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
export interface XChainAddClaimAttestation extends BaseTransaction {
  TransactionType: 'XChainAddClaimAttestation'

  Amount: Amount

  AttestationRewardAccount: string

  AttestationSignerAccount: string

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
// eslint-disable-next-line max-lines-per-function, max-statements, complexity -- okay for this function, lots of things to check
export function validateXChainAddClaimAttestation(
  tx: Record<string, unknown>,
): void {
  validateBaseTransaction(tx)

  if (tx.Amount == null) {
    throw new ValidationError('XChainAddClaimAttestation: missing field Amount')
  }

  if (!isAmount(tx.Amount)) {
    throw new ValidationError('XChainAddClaimAttestation: invalid field Amount')
  }

  if (tx.AttestationRewardAccount == null) {
    throw new ValidationError(
      'XChainAddClaimAttestation: missing field AttestationRewardAccount',
    )
  }

  if (typeof tx.AttestationRewardAccount !== 'string') {
    throw new ValidationError(
      'XChainAddClaimAttestation: invalid field AttestationRewardAccount',
    )
  }

  if (tx.AttestationSignerAccount == null) {
    throw new ValidationError(
      'XChainAddClaimAttestation: missing field AttestationSignerAccount',
    )
  }

  if (typeof tx.AttestationSignerAccount !== 'string') {
    throw new ValidationError(
      'XChainAddClaimAttestation: invalid field AttestationSignerAccount',
    )
  }

  if (tx.Destination !== undefined && typeof tx.Destination !== 'string') {
    throw new ValidationError(
      'XChainAddClaimAttestation: invalid field Destination',
    )
  }

  if (tx.OtherChainSource == null) {
    throw new ValidationError(
      'XChainAddClaimAttestation: missing field OtherChainSource',
    )
  }

  if (typeof tx.OtherChainSource !== 'string') {
    throw new ValidationError(
      'XChainAddClaimAttestation: invalid field OtherChainSource',
    )
  }

  if (tx.PublicKey == null) {
    throw new ValidationError(
      'XChainAddClaimAttestation: missing field PublicKey',
    )
  }

  if (typeof tx.PublicKey !== 'string') {
    throw new ValidationError(
      'XChainAddClaimAttestation: invalid field PublicKey',
    )
  }

  if (tx.Signature == null) {
    throw new ValidationError(
      'XChainAddClaimAttestation: missing field Signature',
    )
  }

  if (typeof tx.Signature !== 'string') {
    throw new ValidationError(
      'XChainAddClaimAttestation: invalid field Signature',
    )
  }

  if (tx.WasLockingChainSend == null) {
    throw new ValidationError(
      'XChainAddClaimAttestation: missing field WasLockingChainSend',
    )
  }

  if (tx.WasLockingChainSend !== 0 && tx.WasLockingChainSend !== 1) {
    throw new ValidationError(
      'XChainAddClaimAttestation: invalid field WasLockingChainSend',
    )
  }

  if (tx.XChainBridge == null) {
    throw new ValidationError(
      'XChainAddClaimAttestation: missing field XChainBridge',
    )
  }

  if (!isXChainBridge(tx.XChainBridge)) {
    throw new ValidationError(
      'XChainAddClaimAttestation: invalid field XChainBridge',
    )
  }

  if (tx.XChainClaimID == null) {
    throw new ValidationError(
      'XChainAddClaimAttestation: missing field XChainClaimID',
    )
  }

  if (typeof tx.XChainClaimID !== 'string') {
    throw new ValidationError(
      'XChainAddClaimAttestation: invalid field XChainClaimID',
    )
  }
}
