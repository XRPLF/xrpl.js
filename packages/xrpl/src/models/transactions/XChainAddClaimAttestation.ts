import { Amount, XChainBridge } from '../common'

import {
  BaseTransaction,
  isAmount,
  isNumber,
  isString,
  isXChainBridge,
  validateBaseTransaction,
  validateOptionalField,
  validateRequiredField,
} from './common'

/**
 * The XChainAddClaimAttestation transaction provides proof from a witness server,
 * attesting to an {@link XChainCommit} transaction.
 *
 * @category Transaction Models
 */
export interface XChainAddClaimAttestation extends BaseTransaction {
  TransactionType: 'XChainAddClaimAttestation'

  /**
   * The amount committed by the {@link XChainCommit} transaction on the source chain.
   */
  Amount: Amount

  /**
   * The account that should receive this signer's share of the SignatureReward.
   */
  AttestationRewardAccount: string

  /**
   * The account on the door account's signer list that is signing the transaction.
   */
  AttestationSignerAccount: string

  /**
   * The destination account for the funds on the destination chain (taken from
   * the {@link XChainCommit} transaction).
   */
  Destination?: string

  /**
   * The account on the source chain that submitted the {@link XChainCommit}
   * transaction that triggered the event associated with the attestation.
   */
  OtherChainSource: string

  /**
   * The public key used to verify the attestation signature.
   */
  PublicKey: string

  /**
   * The signature attesting to the event on the other chain.
   */
  Signature: string

  /**
   * A boolean representing the chain where the event occurred.
   */
  WasLockingChainSend: 0 | 1

  /**
   * The bridge to use to transfer funds.
   */
  XChainBridge: XChainBridge

  /**
   * The XChainClaimID associated with the transfer, which was included in the
   * {@link XChainCommit} transaction.
   */
  XChainClaimID: number | string
}

/**
 * Verify the form and type of an XChainAddClaimAttestation at runtime.
 *
 * @param tx - An XChainAddClaimAttestation Transaction.
 * @throws When the XChainAddClaimAttestation is malformed.
 */
export function validateXChainAddClaimAttestation(
  tx: Record<string, unknown>,
): void {
  validateBaseTransaction(tx)

  validateRequiredField(tx, 'Amount', isAmount)

  validateRequiredField(tx, 'AttestationRewardAccount', isString)

  validateRequiredField(tx, 'AttestationSignerAccount', isString)

  validateOptionalField(tx, 'Destination', isString)

  validateRequiredField(tx, 'OtherChainSource', isString)

  validateRequiredField(tx, 'PublicKey', isString)

  validateRequiredField(tx, 'Signature', isString)

  validateRequiredField(
    tx,
    'WasLockingChainSend',
    (inp) => inp === 0 || inp === 1,
  )

  validateRequiredField(tx, 'XChainBridge', isXChainBridge)

  validateRequiredField(
    tx,
    'XChainClaimID',
    (inp) => isNumber(inp) || isString(inp),
  )
}
