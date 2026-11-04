import {
  PARTICIPANT_CIPHERTEXT_OFFSET,
  PARTICIPANT_PUBKEY_OFFSET,
  PARTICIPANT_STRUCT_SIZE,
  PEDERSEN_PARAMS_AMOUNT_OFFSET,
  PEDERSEN_PARAMS_BLINDING_OFFSET,
  PEDERSEN_PARAMS_CIPHERTEXT_OFFSET,
  PEDERSEN_PARAMS_COMMITMENT_OFFSET,
} from '../src/constants'
import { Marshaller } from '../src/marshal'
import { loadWasmModule, WasmModule } from '../src/module'

const filled = (byte: number, size: number): Uint8Array =>
  new Uint8Array(size).fill(byte)

describe('Marshaller', () => {
  let mod: WasmModule
  let marshaller: Marshaller

  beforeAll(async () => {
    mod = await loadWasmModule()
  })

  beforeEach(() => {
    marshaller = new Marshaller(mod)
  })

  afterEach(() => {
    marshaller.dispose()
  })

  it('alloc returns a nonzero, zero-initialized region', () => {
    const ptr = marshaller.alloc(16)
    expect(ptr).not.toBe(0)
    expect(Array.from(marshaller.readBytes(ptr, 16))).toEqual(
      Array.from(new Uint8Array(16)),
    )
  })

  it('allocBytes and readBytes round-trip a payload', () => {
    const data = Uint8Array.from([1, 2, 3, 4, 5])
    const ptr = marshaller.allocBytes(data)
    expect(Array.from(marshaller.readBytes(ptr, data.length))).toEqual(
      Array.from(data),
    )
  })

  it('writeU32/readU32 round-trip a value little-endian', () => {
    const ptr = marshaller.alloc(4)
    marshaller.writeU32(ptr, 0x04030201)
    expect(marshaller.readU32(ptr)).toBe(0x04030201)
    expect(Array.from(marshaller.readBytes(ptr, 4))).toEqual([1, 2, 3, 4])
  })

  it('allocPedersenParams lays fields at the documented struct offsets', () => {
    const ptr = marshaller.allocPedersenParams({
      commitment: filled(0x11, 33),
      amount: 0x0102030405060708n,
      ciphertext: filled(0x22, 66),
      blindingFactor: filled(0x33, 32),
    })
    // commitment (33 B) at offset 0
    expect(Array.from(marshaller.readBytes(ptr, 33))).toEqual(
      Array.from(filled(0x11, 33)),
    )
    expect(PEDERSEN_PARAMS_COMMITMENT_OFFSET).toBe(0)
    // amount is a little-endian u64 at its offset
    expect(marshaller.readU64(ptr + PEDERSEN_PARAMS_AMOUNT_OFFSET)).toBe(
      0x0102030405060708n,
    )
    // ciphertext (66 B) and blinding factor (32 B) at their offsets
    expect(
      Array.from(
        marshaller.readBytes(ptr + PEDERSEN_PARAMS_CIPHERTEXT_OFFSET, 66),
      ),
    ).toEqual(Array.from(filled(0x22, 66)))
    expect(
      Array.from(
        marshaller.readBytes(ptr + PEDERSEN_PARAMS_BLINDING_OFFSET, 32),
      ),
    ).toEqual(Array.from(filled(0x33, 32)))
  })

  it('allocParticipants packs structs contiguously by stride', () => {
    const ptr = marshaller.allocParticipants([
      { publicKey: filled(0xaa, 33), ciphertext: filled(0xbb, 66) },
      { publicKey: filled(0xcc, 33), ciphertext: filled(0xdd, 66) },
    ])
    const pubkeyAt = (index: number): Uint8Array =>
      marshaller.readBytes(
        ptr + index * PARTICIPANT_STRUCT_SIZE + PARTICIPANT_PUBKEY_OFFSET,
        33,
      )
    const ciphertextAt = (index: number): Uint8Array =>
      marshaller.readBytes(
        ptr + index * PARTICIPANT_STRUCT_SIZE + PARTICIPANT_CIPHERTEXT_OFFSET,
        66,
      )
    expect(Array.from(pubkeyAt(0))).toEqual(Array.from(filled(0xaa, 33)))
    expect(Array.from(ciphertextAt(0))).toEqual(Array.from(filled(0xbb, 66)))
    expect(Array.from(pubkeyAt(1))).toEqual(Array.from(filled(0xcc, 33)))
    expect(Array.from(ciphertextAt(1))).toEqual(Array.from(filled(0xdd, 66)))
  })

  it('dispose zeroes each allocation before freeing it', () => {
    // Capture the heap contents at the instant _free is called: dispose must
    // scrub secret material *before* handing the chunk back (afterwards the
    // allocator overwrites the head with free-list metadata).
    const realFree = mod._free.bind(mod)
    let atFree: number[] | undefined
    mod._free = (ptr: number): void => {
      atFree = Array.from(mod.HEAPU8.slice(ptr, ptr + 48))
      realFree(ptr)
    }
    try {
      marshaller.allocBytes(filled(0x7f, 48))
      marshaller.dispose()
    } finally {
      mod._free = realFree
    }
    expect(atFree).toEqual(Array.from(new Uint8Array(48)))
  })
})
