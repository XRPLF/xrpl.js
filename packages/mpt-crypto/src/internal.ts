import {
  BLINDING_FACTOR_SIZE,
  ELGAMAL_TOTAL_SIZE,
  PEDERSEN_COMMIT_SIZE,
  PUBKEY_SIZE,
} from './constants'
import { hexToBytes } from './hex'
import { RawParticipant, RawPedersenParams } from './marshal'
import { Participant, PedersenParams } from './types'

/** Largest unsigned 64-bit integer — the width of the C `uint64_t` amounts. */
export const U64_MAX = 2n ** 64n - 1n

/**
 * Assert that a bigint fits an unsigned 64-bit WASM parameter.
 *
 * Amounts and ranges are passed straight to WASM `i64` parameters, and the
 * JS→WASM BigInt marshalling wraps modulo 2^64 *without throwing* — so e.g.
 * `2n ** 64n` would be silently encoded as `0`. This guards that at the public
 * API boundary instead.
 *
 * @param value - The value to check.
 * @param label - A human-readable name used in error messages.
 * @param max - Inclusive upper bound (defaults to {@link U64_MAX}).
 * @throws If `value` is negative or greater than `max`.
 */
export function assertUint64(
  value: bigint,
  label: string,
  max: bigint = U64_MAX,
): void {
  if (value < 0n || value > max) {
    throw new Error(`${label} must be an integer in [0, ${max}] (got ${value})`)
  }
}

/** Largest unsigned 32-bit integer — the width of the C `uint32_t` sequence/version. */
export const U32_MAX = 0xffff_ffff

/**
 * Assert that a number fits an unsigned 32-bit WASM parameter.
 *
 * Sequence and version are passed straight to WASM `i32` parameters, where a
 * negative, fractional, or out-of-range value would be silently truncated or
 * wrapped rather than rejected. This guards that at the public API boundary.
 *
 * @param value - The value to check.
 * @param label - A human-readable name used in error messages.
 * @throws If `value` is not an integer in [0, 2^32 - 1].
 */
export function assertUint32(value: number, label: string): void {
  if (!Number.isInteger(value) || value < 0 || value > U32_MAX) {
    throw new Error(
      `${label} must be an integer in [0, ${U32_MAX}] (got ${value})`,
    )
  }
}

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
  // The witness amount is written to a WASM i64 by allocPedersenParams (which
  // wraps silently on overflow); each caller asserts its own top-level amount
  // but not this balance amount, so guard it here at the marshalling boundary.
  assertUint64(params.amount, `${label}.amount`)
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
