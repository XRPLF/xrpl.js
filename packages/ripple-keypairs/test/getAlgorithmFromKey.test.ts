import { getAlgorithmFromKey } from '../src/utils/getAlgorithmFromKey'

function hexData(count: number) {
  // for our purposes any hex will do
  return 'a'.repeat(count)
}

// Remove leading tabs
function dedent(str) {
  return `${str}`.replace(/(?<tabs>\n)\s+/gu, '$1')
}

describe('getAlgorithmFromKey', () => {
  it('should return ed25519 for valid ed25519 private key', () => {
    const privateKey = `ed${hexData(64)}`
    expect(getAlgorithmFromKey(privateKey, 'private')).toEqual('ed25519')
  })

  it('should return ed25519 for valid ed25519 public key', () => {
    const publicKey = `ed${hexData(64)}`
    expect(getAlgorithmFromKey(publicKey, 'public')).toEqual('ed25519')
  })

  it('should return ecdsa-secp256k1 for valid secp256k1 private key without prefix', () => {
    // 32 bytes, no prefix
    const privateKey = hexData(64)
    expect(getAlgorithmFromKey(privateKey, 'private')).toEqual(
      'ecdsa-secp256k1',
    )
  })

  it('should return ecdsa-secp256k1 for valid secp256k1 private key with 0x00 prefix', () => {
    // 33 bytes, 0x00 prefix
    const privateKey = `00${hexData(64)}`
    expect(getAlgorithmFromKey(privateKey, 'private')).toEqual(
      'ecdsa-secp256k1',
    )
  })

  it('should return ecdsa-secp256k1 for valid secp256k1 public key with 0x02 prefix', () => {
    // 33 bytes, 0x02 prefix
    const publicKey = `02${hexData(64)}`
    expect(getAlgorithmFromKey(publicKey, 'public')).toEqual('ecdsa-secp256k1')
  })

  it('should throw error for invalid private key format', () => {
    // Invalid tag and length
    const privateKey = `ff${hexData(60)}`
    try {
      getAlgorithmFromKey(privateKey, 'private')
    } catch (error: unknown) {
      if (error instanceof Error) {
        expect(dedent(error.message)).toEqual(
          dedent(`invalid_key:
  
        Type: private
        Key: ffaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
        Prefix: 0xff 
        Length: 31 bytes
  
        Acceptable private formats are:
        ecdsa-secp256k1   - Prefix: None   Length: 32 bytes
        ecdsa-secp256k1   - Prefix: 0x00   Length: 33 bytes
        ed25519           - Prefix: 0xed   Length: 33 bytes
    `),
        )
      }
    }
  })

  it('should throw error for invalid public key format', () => {
    // Invalid tag and length
    const publicKey = `ff${hexData(60)}`
    try {
      getAlgorithmFromKey(publicKey, 'public')
    } catch (error: unknown) {
      if (error instanceof Error) {
        expect(dedent(error.message)).toEqual(
          dedent(`invalid_key:

      Type: public
      Key: ffaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
      Prefix: 0xff 
      Length: 31 bytes

      Acceptable public formats are:
      ed25519           - Prefix: 0xed   Length: 33 bytes
      ecdsa-secp256k1   - Prefix: 0x02   Length: 33 bytes
      ecdsa-secp256k1   - Prefix: 0x03   Length: 33 bytes
      ecdsa-secp256k1   - Prefix: 0x04   Length: 65 bytes
    `),
        )
      }
    }
  })
})
