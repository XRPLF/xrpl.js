import knownAnswer from './fixtures/known-answer.json'
import {
  deriveAddress,
  deriveKeypair,
  generateSeed,
  sign,
  verify,
} from '../src'
import type { Algorithm } from '../src'
import { hexToBytes, stringToHex } from '@xrplf/isomorphic/utils'

interface Vector {
  algorithm: string
  entropyHex: string
  seed: string
  keypair: { privateKey: string; publicKey: string }
  address: string
  message: string
  signature: string
  wrongPublicKey: string
}

const vectors: Vector[] = [knownAnswer.secp256k1, knownAnswer.ed25519]

function toAlgorithm(name: string): Algorithm {
  return name === 'ed25519' ? 'ed25519' : 'ecdsa-secp256k1'
}

function flipLastNibble(hex: string): string {
  const last = hex.slice(-1)
  const replacement = last === '0' ? '1' : '0'
  return hex.slice(0, -1) + replacement
}

describe.each(vectors)('known-answer keypairs - $algorithm', (vector) => {
  const entropy = hexToBytes(vector.entropyHex)
  const messageHex = stringToHex(vector.message)

  it('generateSeed reproduces the recorded seed', () => {
    const seed = generateSeed({
      entropy,
      algorithm: toAlgorithm(vector.algorithm),
    })
    expect(seed).toEqual(vector.seed)
  })

  it('deriveKeypair reproduces the recorded keypair', () => {
    expect(deriveKeypair(vector.seed)).toEqual(vector.keypair)
  })

  it('deriveAddress reproduces the recorded address', () => {
    expect(deriveAddress(vector.keypair.publicKey)).toEqual(vector.address)
  })

  it('sign reproduces the recorded signature', () => {
    expect(sign(messageHex, vector.keypair.privateKey)).toEqual(
      vector.signature,
    )
  })

  it('verify accepts the recorded signature', () => {
    expect(verify(messageHex, vector.signature, vector.keypair.publicKey)).toBe(
      true,
    )
  })

  it('verify rejects a tampered message', () => {
    const tamperedHex = flipLastNibble(messageHex)
    expect(
      verify(tamperedHex, vector.signature, vector.keypair.publicKey),
    ).toBe(false)
  })

  it('verify rejects a wrong public key', () => {
    expect(verify(messageHex, vector.signature, vector.wrongPublicKey)).toBe(
      false,
    )
  })

  it('verify rejects a truncated signature', () => {
    const truncated = vector.signature.slice(0, vector.signature.length - 8)
    expect(() =>
      verify(messageHex, truncated, vector.keypair.publicKey),
    ).toThrow()
  })

  it('round trip from generateSeed through verify holds', () => {
    const seed = generateSeed({ algorithm: toAlgorithm(vector.algorithm) })
    const keypair = deriveKeypair(seed)
    const address = deriveAddress(keypair.publicKey)
    expect(address.startsWith('r')).toBe(true)
    const signature = sign(messageHex, keypair.privateKey)
    expect(verify(messageHex, signature, keypair.publicKey)).toBe(true)
    expect(verify(messageHex, signature, vector.wrongPublicKey)).toBe(false)
  })
})
