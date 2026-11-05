import { bytesToHex, hexToBytes } from '@xrplf/isomorphic/utils'

import vector from './fixtures/dilithium.json'
import {
  deriveAddress,
  deriveKeypair,
  generateSeed,
  sign,
  verify,
} from '../src'
import { getAlgorithmFromKey } from '../src/utils/getAlgorithmFromKey'

// The vector is a standalone xrpld (rippled xrplf/quantum) wallet_propose with
// key_type dilithium and a sign of one Payment with that seed.
describe('dilithium', () => {
  it('generateSeed encodes the entropy as the family seed wallet_propose returns', () => {
    expect(
      generateSeed({
        entropy: hexToBytes(vector.seedHex),
        algorithm: 'dilithium',
      }),
    ).toEqual(vector.seed)
  })

  it('deriveKeypair derives the public key wallet_propose returns', () => {
    const keypair = deriveKeypair(vector.seed, { algorithm: 'dilithium' })
    expect(keypair.publicKey).toEqual(vector.publicKey)
    expect(keypair.privateKey).toHaveLength(2560 * 2)
  })

  it('deriveAddress gives the account wallet_propose returns', () => {
    expect(deriveAddress(vector.publicKey)).toEqual(vector.address)
  })

  it('verify accepts the signature xrpld made over the signing data', () => {
    expect(verify(vector.signingData, vector.signature, vector.publicKey)).toBe(
      true,
    )
  })

  it('verify refuses the xrpld signature over other data', () => {
    const data = hexToBytes(vector.signingData)
    data[data.length - 1] = (data[data.length - 1] + 1) % 256
    const otherData = bytesToHex(data)
    expect(verify(otherData, vector.signature, vector.publicKey)).toBe(false)
  })

  it('sign makes a signature over the signing data that verifies', () => {
    const { privateKey } = deriveKeypair(vector.seed, {
      algorithm: 'dilithium',
    })
    const signature = sign(vector.signingData, privateKey)
    expect(signature).toHaveLength(2420 * 2)
    expect(verify(vector.signingData, signature, vector.publicKey)).toBe(true)
  })

  it('getAlgorithmFromKey maps unprefixed Dilithium key lengths', () => {
    const { privateKey } = deriveKeypair(vector.seed, {
      algorithm: 'dilithium',
    })
    expect(getAlgorithmFromKey(privateKey, 'private')).toEqual('dilithium')
    expect(getAlgorithmFromKey(vector.publicKey, 'public')).toEqual('dilithium')
  })
})
