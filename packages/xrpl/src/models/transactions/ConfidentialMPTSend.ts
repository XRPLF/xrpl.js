import { ValidationError } from '../../errors'

import {
  Account,
  BaseTransaction,
  isAccount,
  isHexWithByteLength,
  isNumber,
  isString,
  validateBaseTransaction,
  validateRequiredField,
  validateOptionalField,
  validateCredentialsList,
  MAX_AUTHORIZED_CREDENTIALS,
  CONFIDENTIAL_EC_POINT_BYTES,
  CONFIDENTIAL_ELGAMAL_CIPHERTEXT_BYTES,
  CONFIDENTIAL_SEND_PROOF_BYTES,
} from './common'

/**
 * The ConfidentialMPTSend transaction transfers a confidential (encrypted) MPT
 * amount from the sender's confidential balance to a destination's confidential
 * inbox, without revealing the amount on-ledger.
 *
 * @category Transaction Models
 */
export interface ConfidentialMPTSend extends BaseTransaction {
  TransactionType: 'ConfidentialMPTSend'
  /**
   * Identifies the MPTokenIssuance being transferred.
   */
  MPTokenIssuanceID: string
  /** The unique address of the account receiving the confidential transfer. */
  Destination: Account
  /**
   * Arbitrary tag that identifies the reason for the transfer to the
   * destination, or a hosted recipient to pay.
   */
  DestinationTag?: number
  /**
   * ElGamal ciphertext of the amount encrypted under the sender's key
   * (66 bytes).
   */
  SenderEncryptedAmount: string
  /**
   * ElGamal ciphertext of the amount encrypted under the destination's key
   * (66 bytes).
   */
  DestinationEncryptedAmount: string
  /**
   * ElGamal ciphertext of the amount encrypted under the issuer's key
   * (66 bytes).
   */
  IssuerEncryptedAmount: string
  /**
   * ElGamal ciphertext of the amount encrypted under the auditor's key
   * (66 bytes). Present only when an auditor key is registered.
   */
  AuditorEncryptedAmount?: string
  /**
   * The zero-knowledge proof binding the ciphertexts, the amount commitment,
   * and the resulting balance commitment.
   */
  ZKProof: string
  /**
   * The Pedersen commitment to the transferred amount (33-byte EC point).
   */
  AmountCommitment: string
  /**
   * The Pedersen commitment to the sender's remaining confidential balance
   * (33-byte EC point).
   */
  BalanceCommitment: string
  /**
   * Credentials associated with the sender of this transaction.
   * The credentials included must not be expired.
   */
  CredentialIDs?: string[]
}

/**
 * Verify the form and type of a ConfidentialMPTSend at runtime.
 *
 * @param tx - A ConfidentialMPTSend Transaction.
 * @throws When the ConfidentialMPTSend is malformed.
 */
export function validateConfidentialMPTSend(tx: Record<string, unknown>): void {
  const isCiphertext = isHexWithByteLength(
    CONFIDENTIAL_ELGAMAL_CIPHERTEXT_BYTES,
  )
  const isCommitment = isHexWithByteLength(CONFIDENTIAL_EC_POINT_BYTES)
  validateBaseTransaction(tx)
  validateRequiredField(tx, 'MPTokenIssuanceID', isString)
  validateRequiredField(tx, 'Destination', isAccount)
  if (tx.Account === tx.Destination) {
    throw new ValidationError(
      'ConfidentialMPTSend: Destination and Account must be different',
    )
  }
  validateOptionalField(tx, 'DestinationTag', isNumber)
  validateRequiredField(tx, 'SenderEncryptedAmount', isCiphertext)
  validateRequiredField(tx, 'DestinationEncryptedAmount', isCiphertext)
  validateRequiredField(tx, 'IssuerEncryptedAmount', isCiphertext)
  validateOptionalField(tx, 'AuditorEncryptedAmount', isCiphertext)
  validateRequiredField(
    tx,
    'ZKProof',
    isHexWithByteLength(CONFIDENTIAL_SEND_PROOF_BYTES),
  )
  validateRequiredField(tx, 'AmountCommitment', isCommitment)
  validateRequiredField(tx, 'BalanceCommitment', isCommitment)
  validateCredentialsList(
    tx.CredentialIDs,
    tx.TransactionType,
    true,
    MAX_AUTHORIZED_CREDENTIALS,
  )
}
