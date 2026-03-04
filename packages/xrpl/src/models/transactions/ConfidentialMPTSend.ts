import {
  BaseTransaction,
  isString,
  validateBaseTransaction,
  validateRequiredField,
  validateOptionalField,
  isAccount,
  Account,
  validateCredentialsList,
  MAX_AUTHORIZED_CREDENTIALS,
} from './common'

/**
 * The ConfidentialMPTSend transaction sends confidential MPT from one
 * account to another without revealing the transfer amount publicly.
 *
 * The amount is encrypted for the sender, destination, issuer, and
 * optionally an auditor. A zero-knowledge proof verifies that the
 * sender has sufficient balance without revealing actual amounts.
 */
export interface ConfidentialMPTSend extends BaseTransaction {
  TransactionType: 'ConfidentialMPTSend'

  /**
   * Identifies the MPTokenIssuance being transferred.
   */
  MPTokenIssuanceID: string

  /**
   * The destination account receiving the confidential MPT.
   */
  Destination: Account

  /**
   * The encrypted amount being sent, encrypted for the sender.
   * 66 bytes (two 33-byte compressed EC points), hex-encoded.
   */
  SenderEncryptedAmount: string

  /**
   * The encrypted amount being received, encrypted for the destination.
   * 66 bytes (two 33-byte compressed EC points), hex-encoded.
   */
  DestinationEncryptedAmount: string

  /**
   * The encrypted amount for the issuer's tracking purposes.
   * 66 bytes (two 33-byte compressed EC points), hex-encoded.
   */
  IssuerEncryptedAmount: string

  /**
   * Optional. The encrypted amount for the auditor (if configured).
   * 66 bytes (two 33-byte compressed EC points), hex-encoded.
   */
  AuditorEncryptedAmount?: string

  /**
   * Zero-knowledge proof proving the sender has sufficient balance
   * and that all encrypted amounts are consistent.
   */
  ZKProof: string

  /**
   * The Pedersen commitment to the transfer amount.
   * Required for proof verification.
   */
  AmountCommitment: string

  /**
   * The Pedersen commitment to the sender's remaining balance after transfer.
   * Required for balance verification.
   */
  BalanceCommitment: string

  /**
   * Optional. Array of credential IDs that may be required for
   * authorized transfers.
   */
  CredentialIDs?: string[]
}

/**
 * Verify the form and type of a ConfidentialMPTSend at runtime.
 *
 * @param tx - A ConfidentialMPTSend Transaction.
 * @throws When the ConfidentialMPTSend is Malformed.
 */
export function validateConfidentialMPTSend(tx: Record<string, unknown>): void {
  validateBaseTransaction(tx)

  validateRequiredField(tx, 'MPTokenIssuanceID', isString)
  validateRequiredField(tx, 'Destination', isAccount)
  validateRequiredField(tx, 'SenderEncryptedAmount', isString)
  validateRequiredField(tx, 'DestinationEncryptedAmount', isString)
  validateRequiredField(tx, 'IssuerEncryptedAmount', isString)
  validateRequiredField(tx, 'ZKProof', isString)
  validateRequiredField(tx, 'AmountCommitment', isString)
  validateRequiredField(tx, 'BalanceCommitment', isString)

  validateOptionalField(tx, 'AuditorEncryptedAmount', isString)

  validateCredentialsList(
    tx.CredentialIDs,
    tx.TransactionType,
    true,
    MAX_AUTHORIZED_CREDENTIALS,
  )
}
