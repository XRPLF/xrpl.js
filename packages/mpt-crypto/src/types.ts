/**
 * Public-facing types for the `@xrplf/mpt-crypto` hex-in/hex-out API. Every
 * byte field is an uppercase, even-length hex string (no `0x` prefix); integer
 * amounts are `bigint` to losslessly carry the full `uint64_t` range.
 */

/**
 * A participant in a Confidential MPT proof — a 33-byte compressed public key
 * and the 66-byte ElGamal ciphertext encrypting the amount under that key.
 * Mirrors the C `mpt_confidential_participant` struct.
 */
export interface Participant {
  publicKey: string
  ciphertext: string
}

/**
 * The witness for a Pedersen-committed value, mirroring the C
 * `mpt_pedersen_proof_params` struct: the 33-byte Pedersen commitment, the
 * committed integer amount, the 66-byte ElGamal ciphertext of that amount, and
 * the 32-byte blinding factor (rho) used in the commitment.
 */
export interface PedersenParams {
  commitment: string
  amount: bigint
  ciphertext: string
  blindingFactor: string
}

/**
 * Inputs for {@link getConfidentialSendProof}, the 946-byte proof attached to a
 * ConfidentialMPTSend transaction.
 */
export interface SendProofParams {
  /** The sender's 32-byte private key. */
  privateKey: string
  /** The sender's 33-byte public key. */
  publicKey: string
  /** The integer amount being sent. */
  amount: bigint
  /** Participants in order: sender, destination, issuer, and auditor (optional). */
  participants: Participant[]
  /** The shared ElGamal randomness r, also the blinding factor for `pc_m`. */
  txBlindingFactor: string
  /** The 32-byte transaction context hash. */
  contextHash: string
  /** The 33-byte Pedersen commitment to the amount (`pc_m = m*G + r*H`). */
  amountCommitment: string
  /** The sender's balance witness (`pc_b`, balance, b1||b2, rho). */
  balanceParams: PedersenParams
}
