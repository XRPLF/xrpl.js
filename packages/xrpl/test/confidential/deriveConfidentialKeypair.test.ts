import { assert } from 'chai'
import { generateSeed } from 'ripple-keypairs'

import { deriveConfidentialKeypair } from '../../src/confidential'

describe('deriveConfidentialKeypair', function () {
  it('produces a 33-byte public key and a bare 32-byte private key', function () {
    const { publicKey, privateKey } = deriveConfidentialKeypair()
    assert.lengthOf(publicKey, 66, 'public key is 33 bytes (compressed)')
    assert.lengthOf(privateKey, 64, 'private key is the bare 32-byte scalar')
  })

  it('derives deterministically from a seed (recoverable)', function () {
    const seed = generateSeed({ algorithm: 'ecdsa-secp256k1' })
    assert.deepEqual(
      deriveConfidentialKeypair(seed),
      deriveConfidentialKeypair(seed),
      'same seed yields the same keypair',
    )
  })

  it('returns a fresh keypair when no seed is given', function () {
    assert.notDeepEqual(
      deriveConfidentialKeypair(),
      deriveConfidentialKeypair(),
      'two random keypairs differ',
    )
  })

  it('forces secp256k1 even for an ed25519 seed', function () {
    const edSeed = generateSeed({ algorithm: 'ed25519' })
    const { publicKey, privateKey } = deriveConfidentialKeypair(edSeed)
    assert.lengthOf(privateKey, 64)
    // secp256k1 compressed public keys start with 02/03 (ed25519 would be ED)
    assert.include(['02', '03'], publicKey.slice(0, 2))
  })
})
