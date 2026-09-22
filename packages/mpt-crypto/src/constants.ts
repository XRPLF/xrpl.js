/**
 * Byte sizes mirroring `mpt-crypto/include/mpt_protocol.h`. These are the
 * authoritative wire/buffer sizes for the Confidential MPT (XLS-0096) crypto
 * primitives compiled into the vendored WASM module.
 */

/** secp256k1 compressed public / ElGamal key. */
export const PUBKEY_SIZE = 33
/** secp256k1 private key. */
export const PRIVKEY_SIZE = 32
/** ElGamal randomness / Pedersen blinding factor scalar. */
export const BLINDING_FACTOR_SIZE = 32
/** A full ElGamal ciphertext (C1 || C2). */
export const ELGAMAL_TOTAL_SIZE = 66
/** A Pedersen commitment point. */
export const PEDERSEN_COMMIT_SIZE = 33
/** The 32-byte transaction context hash (challenge) consumed by the proofs. */
export const CONTEXT_HASH_SIZE = 32
/** 20-byte XRPL AccountID. */
export const ACCOUNT_ID_SIZE = 20
/** 24-byte MPTokenIssuanceID. */
export const ISSUANCE_ID_SIZE = 24

/** ConfidentialMPTConvert ZKProof length. */
export const CONVERT_PROOF_SIZE = 64
/** ConfidentialMPTClawback ZKProof length. */
export const CLAWBACK_PROOF_SIZE = 64
/** ConfidentialMPTConvertBack ZKProof length (128 sigma + 688 bulletproof). */
export const CONVERT_BACK_PROOF_SIZE = 816
/** ConfidentialMPTSend ZKProof length (192 sigma + 754 bulletproof). */
export const SEND_PROOF_SIZE = 946

/**
 * In-memory layout of the C `mpt_confidential_participant` struct
 * (`{ uint8_t pubkey[33]; uint8_t ciphertext[66]; }`, alignment 1).
 */
export const PARTICIPANT_PUBKEY_OFFSET = 0
export const PARTICIPANT_CIPHERTEXT_OFFSET = PUBKEY_SIZE
export const PARTICIPANT_STRUCT_SIZE = PUBKEY_SIZE + ELGAMAL_TOTAL_SIZE

/**
 * In-memory layout of the C `mpt_pedersen_proof_params` struct:
 * `{ uint8_t pedersen_commitment[33]; uint64_t amount; uint8_t ciphertext[66];
 *    uint8_t blinding_factor[32]; }`. The `uint64_t` forces 8-byte alignment,
 * so the commitment is padded from 33 to 40 and the struct size is rounded up
 * to a multiple of 8.
 */
export const PEDERSEN_PARAMS_COMMITMENT_OFFSET = 0
export const PEDERSEN_PARAMS_AMOUNT_OFFSET = 40
export const PEDERSEN_PARAMS_CIPHERTEXT_OFFSET = 48
export const PEDERSEN_PARAMS_BLINDING_OFFSET = 114
export const PEDERSEN_PARAMS_STRUCT_SIZE = 152
