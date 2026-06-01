/**
 * Parameter types for the high-level Confidential MPT (XLS-0096) builders. Every
 * byte field is an uppercase, even-length hex string (no `0x` prefix); integer
 * amounts are `bigint` to losslessly carry the full `uint64_t` range.
 */

/**
 * An ElGamal keypair used to encrypt to, and decrypt from, a confidential MPT
 * balance: a 32-byte hex private key and the matching 33-byte hex public key.
 */
export interface ConfidentialKeypair {
  privateKey: string
  publicKey: string
}

/** Inputs shared by every confidential builder. */
interface BaseConfidentialParams {
  /** The 24-byte hex MPTokenIssuanceID. */
  mptIssuanceID: string
  /**
   * Optional explicit sequence number. When omitted the builder queries the
   * account's current sequence. The returned transaction pins `Sequence`, so it
   * must be submitted without re-deriving the sequence (the proof is bound to it).
   */
  sequence?: number
}

/** Inputs for {@link prepareConfidentialConvert}. */
export interface ConfidentialConvertParams extends BaseConfidentialParams {
  /** The converting holder's classic XRPL address. */
  account: string
  /** The public MPT amount being moved into the confidential balance. */
  amount: bigint
  /** The holder's ElGamal keypair. */
  holder: ConfidentialKeypair
  /**
   * Whether to register the holder's encryption key on this transaction.
   * Defaults to `true` (required on a holder's first conversion).
   */
  registerKey?: boolean
}

/** Inputs for {@link prepareConfidentialConvertBack}. */
export interface ConfidentialConvertBackParams extends BaseConfidentialParams {
  /** The holder's classic XRPL address. */
  account: string
  /** The public MPT amount being revealed from the confidential balance. */
  amount: bigint
  /** The holder's ElGamal keypair. */
  holder: ConfidentialKeypair
}

/** Inputs for {@link prepareConfidentialSend}. */
export interface ConfidentialSendParams extends BaseConfidentialParams {
  /** The sender's classic XRPL address. */
  account: string
  /** The destination's classic XRPL address. */
  destination: string
  /** The confidential MPT amount being transferred. */
  amount: bigint
  /** The sender's ElGamal keypair. */
  sender: ConfidentialKeypair
  /** Optional destination tag. */
  destinationTag?: number
  /** Optional credential IDs to satisfy the destination's deposit auth. */
  credentialIDs?: string[]
}

/** Inputs for {@link prepareConfidentialClawback}. */
export interface ConfidentialClawbackParams extends BaseConfidentialParams {
  /** The issuer's classic XRPL address. */
  account: string
  /** The holder whose confidential balance is being clawed back. */
  holder: string
  /** The issuer's ElGamal keypair. */
  issuer: ConfidentialKeypair
  /**
   * Optional explicit amount to claw back. When omitted the builder decrypts the
   * holder's issuer-encrypted balance to recover the full amount.
   */
  amount?: bigint
}

/** Inputs for {@link prepareConfidentialMergeInbox}. */
export interface ConfidentialMergeInboxParams extends BaseConfidentialParams {
  /** The holder's classic XRPL address. */
  account: string
}
