/* eslint-disable @typescript-eslint/member-ordering, @typescript-eslint/naming-convention -- internal WASM helper */
import {
  PARTICIPANT_CIPHERTEXT_OFFSET,
  PARTICIPANT_PUBKEY_OFFSET,
  PARTICIPANT_STRUCT_SIZE,
  PEDERSEN_PARAMS_AMOUNT_OFFSET,
  PEDERSEN_PARAMS_BLINDING_OFFSET,
  PEDERSEN_PARAMS_CIPHERTEXT_OFFSET,
  PEDERSEN_PARAMS_COMMITMENT_OFFSET,
  PEDERSEN_PARAMS_STRUCT_SIZE,
} from './constants'
import { WasmModule } from './module'

/**
 * Byte-level view of a `mpt_confidential_participant` struct, as consumed by
 * {@link Marshaller.allocParticipants}. This is the internal counterpart of the
 * hex-based public `Participant` type.
 */
export interface RawParticipant {
  publicKey: Uint8Array
  ciphertext: Uint8Array
}

/**
 * Byte-level view of a `mpt_pedersen_proof_params` struct, as consumed by
 * {@link Marshaller.allocPedersenParams}. Internal counterpart of the hex-based
 * public `PedersenParams` type.
 */
export interface RawPedersenParams {
  commitment: Uint8Array
  amount: bigint
  ciphertext: Uint8Array
  blindingFactor: Uint8Array
}

/**
 * Scratch-memory helper bound to a single {@link WasmModule} instance. Tracks
 * every allocation so a call site can release all of them at once via
 * {@link Marshaller.dispose}. A fresh {@link DataView}/`HEAPU8` is taken on each
 * access because the module is built with `ALLOW_MEMORY_GROWTH=1`, which can
 * replace the underlying `ArrayBuffer` after any `_malloc`.
 */
export class Marshaller {
  private readonly mod: WasmModule
  private readonly ptrs: number[] = []

  public constructor(mod: WasmModule) {
    this.mod = mod
  }

  /** Allocate `size` bytes of zero-initialized scratch memory. */
  public alloc(size: number): number {
    const ptr = this.mod._malloc(size)
    // `_malloc` returns 0 on failure; writing at address 0 would corrupt the
    // WASM heap, so fail loudly instead.
    if (ptr === 0) {
      throw new Error(`mpt-crypto: failed to allocate ${size} bytes`)
    }
    this.mod.HEAPU8.fill(0, ptr, ptr + size)
    this.ptrs.push(ptr)
    return ptr
  }

  /** Allocate and copy `data` into WASM memory; returns the pointer. */
  public allocBytes(data: Uint8Array): number {
    const ptr = this.mod._malloc(data.length)
    if (ptr === 0) {
      throw new Error(`mpt-crypto: failed to allocate ${data.length} bytes`)
    }
    this.mod.HEAPU8.set(data, ptr)
    this.ptrs.push(ptr)
    return ptr
  }

  /** Copy `len` bytes back out of WASM memory into a detached Uint8Array. */
  public readBytes(ptr: number, len: number): Uint8Array {
    return this.mod.HEAPU8.slice(ptr, ptr + len)
  }

  private view(): DataView {
    return new DataView(this.mod.HEAPU8.buffer)
  }

  /** Write a little-endian uint32 at `ptr`. */
  public writeU32(ptr: number, value: number): void {
    this.view().setUint32(ptr, value, true)
  }

  /** Read a little-endian uint32 at `ptr`. */
  public readU32(ptr: number): number {
    return this.view().getUint32(ptr, true)
  }

  /** Read a little-endian uint64 at `ptr`. */
  public readU64(ptr: number): bigint {
    return this.view().getBigUint64(ptr, true)
  }

  /** Allocate and populate an `mpt_pedersen_proof_params` struct. */
  public allocPedersenParams(params: RawPedersenParams): number {
    const ptr = this.alloc(PEDERSEN_PARAMS_STRUCT_SIZE)
    this.mod.HEAPU8.set(
      params.commitment,
      ptr + PEDERSEN_PARAMS_COMMITMENT_OFFSET,
    )
    this.view().setBigUint64(
      ptr + PEDERSEN_PARAMS_AMOUNT_OFFSET,
      params.amount,
      true,
    )
    this.mod.HEAPU8.set(
      params.ciphertext,
      ptr + PEDERSEN_PARAMS_CIPHERTEXT_OFFSET,
    )
    this.mod.HEAPU8.set(
      params.blindingFactor,
      ptr + PEDERSEN_PARAMS_BLINDING_OFFSET,
    )
    return ptr
  }

  /** Allocate and populate a contiguous array of participant structs. */
  public allocParticipants(participants: RawParticipant[]): number {
    const ptr = this.alloc(PARTICIPANT_STRUCT_SIZE * participants.length)
    participants.forEach((participant, index) => {
      const base = ptr + index * PARTICIPANT_STRUCT_SIZE
      this.mod.HEAPU8.set(
        participant.publicKey,
        base + PARTICIPANT_PUBKEY_OFFSET,
      )
      this.mod.HEAPU8.set(
        participant.ciphertext,
        base + PARTICIPANT_CIPHERTEXT_OFFSET,
      )
    })
    return ptr
  }

  /** Free every allocation made through this marshaller. */
  public dispose(): void {
    for (const ptr of this.ptrs) {
      this.mod._free(ptr)
    }
    this.ptrs.length = 0
  }
}
