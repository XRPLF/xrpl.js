import { Amount, XChainBridge } from '../common'

import {
  Account,
  BaseTransaction,
  isAccount,
  isAmount,
  isNumber,
  isString,
  isXChainBridge,
  validateBaseTransaction,
  validateRequiredField,
} from './common'

/**
 * The XChainAddAccountCreateAttestation transaction provides an attestation
 * from a witness server that a {@link XChainAccountCreateCommit} transaction
 * occurred on the other chain.
 *
 * @category Transaction Models
 */
export interface XChainAddAccountCreateAttestation extends BaseTransaction {
  TransactionType: 'XChainAddAccountCreateAttestation'

  /**
   * The amount committed by the {@link XChainAccountCreateCommit} transaction
   * on the source chain.
   */
  Amount: Amount

  /**
   * The account that should receive this signer's share of the SignatureReward.
   */
  AttestationRewardAccount: Account

  /**
   * The account on the door account's signer list that is signing the transaction.
   */
  AttestationSignerAccount: Account

  /**
   * The destination account for the funds on the destination chain.
   */
  Destination: Account

  /**
   * The account on the source chain that submitted the {@link XChainAccountCreateCommit}
   * transaction that triggered the event associated with the attestation.
   */
  OtherChainSource: Account

  /**
   * The public key used to verify the signature.
   */
  PublicKey: string

  /**
   * The signature attesting to the event on the other chain.
   */
  Signature: string

  /**
   * The signature reward paid in the {@link XChainAccountCreateCommit} transaction.
   */
  SignatureReward: Amount

  /**
   * A boolean representing the chain where the event occurred.
   */
  WasLockingChainSend: 0 | 1

  /**
   * The counter that represents the order that the claims must be processed in.
   */
  XChainAccountCreateCount: number | string

  /**
   * The bridge associated with the attestation.
   */
  XChainBridge: XChainBridge
}

/**
 * Verify the form and type of an XChainAddAccountCreateAttestation at runtime.
 *
 * @param tx - An XChainAddAccountCreateAttestation Transaction.
 * @throws When the XChainAddAccountCreateAttestation is malformed.
 */
export function validateXChainAddAccountCreateAttestation(
  tx: Record<string, unknown>,
): void {
  validateBaseTransaction(tx)

  validateRequiredField(tx, 'Amount', isAmount)

  validateRequiredField(tx, 'AttestationRewardAccount', isAccount)

  validateRequiredField(tx, 'AttestationSignerAccount', isAccount)

  validateRequiredField(tx, 'Destination', isAccount)

  validateRequiredField(tx, 'OtherChainSource', isAccount)

  validateRequiredField(tx, 'PublicKey', isString)

  validateRequiredField(tx, 'Signature', isString)

  validateRequiredField(tx, 'SignatureReward', isAmount)

  validateRequiredField(
    tx,
    'WasLockingChainSend',
    (inp: unknown): inp is 0 | 1 => inp === 0 || inp === 1,
  )

  validateRequiredField(
    tx,
    'XChainAccountCreateCount',
    (inp: unknown): inp is number | string => isNumber(inp) || isString(inp),
  )

  validateRequiredField(tx, 'XChainBridge', isXChainBridge)
}
