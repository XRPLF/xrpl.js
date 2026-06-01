import {
  BLINDING_FACTOR_SIZE,
  ELGAMAL_TOTAL_SIZE,
  PEDERSEN_COMMIT_SIZE,
  PUBKEY_SIZE,
} from './constants'
import { hexToBytes } from './hex'
import { RawParticipant, RawPedersenParams } from './marshal'
import { Participant, PedersenParams } from './types'

/**
 * Decode a hex-encoded {@link Participant} into its byte-struct form.
 *
 * @param participant - The hex participant to decode.
 * @param label - A human-readable name used in error messages.
 * @returns The decoded {@link RawParticipant}.
 * @throws If either field is malformed or the wrong length.
 */
export function rawParticipant(
  participant: Participant,
  label: string,
): RawParticipant {
  return {
    publicKey: hexToBytes(
      participant.publicKey,
      `${label}.publicKey`,
      PUBKEY_SIZE,
    ),
    ciphertext: hexToBytes(
      participant.ciphertext,
      `${label}.ciphertext`,
      ELGAMAL_TOTAL_SIZE,
    ),
  }
}

/**
 * Decode a hex-encoded {@link PedersenParams} into its byte-struct form.
 *
 * @param params - The hex Pedersen witness to decode.
 * @param label - A human-readable name used in error messages.
 * @returns The decoded {@link RawPedersenParams}.
 * @throws If any field is malformed or the wrong length.
 */
export function rawPedersenParams(
  params: PedersenParams,
  label: string,
): RawPedersenParams {
  return {
    commitment: hexToBytes(
      params.commitment,
      `${label}.commitment`,
      PEDERSEN_COMMIT_SIZE,
    ),
    amount: params.amount,
    ciphertext: hexToBytes(
      params.ciphertext,
      `${label}.ciphertext`,
      ELGAMAL_TOTAL_SIZE,
    ),
    blindingFactor: hexToBytes(
      params.blindingFactor,
      `${label}.blindingFactor`,
      BLINDING_FACTOR_SIZE,
    ),
  }
}
