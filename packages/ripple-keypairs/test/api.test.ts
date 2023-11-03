import fixtures from './fixtures/api.json'
import {
  decodeSeed,
  deriveAddress,
  deriveKeypair,
  deriveNodeAddress,
  generateSeed,
  sign,
  verify,
} from '../src'

const entropy = new Uint8Array([
  1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16,
])

describe('api', () => {
  it('generateSeed - secp256k1', () => {
    expect(generateSeed({ entropy })).toEqual(fixtures.secp256k1.seed)
  })

  it('generateSeed - secp256k1, random', () => {
    const seed = generateSeed()
    expect(seed.startsWith('s')).toBeTruthy()
    const { type, bytes } = decodeSeed(seed)
    expect(type).toEqual('secp256k1')
    expect(bytes.length).toEqual(16)
  })

  it('generateSeed - ed25519', () => {
    expect(generateSeed({ entropy, algorithm: 'ed25519' })).toEqual(
      fixtures.ed25519.seed,
    )
  })

  it('generateSeed - ed25519, random', () => {
    const seed = generateSeed({ algorithm: 'ed25519' })
    expect(seed.startsWith('sEd')).toBeTruthy()
    const { type, bytes } = decodeSeed(seed)
    expect(type).toEqual('ed25519')
    expect(bytes.length).toEqual(16)
  })

  it('deriveKeypair - secp256k1', () => {
    const keypair = deriveKeypair(fixtures.secp256k1.seed)
    expect(keypair).toEqual(fixtures.secp256k1.keypair)
  })

  it('deriveKeypair - ed25519', () => {
    const keypair = deriveKeypair(fixtures.ed25519.seed)
    expect(keypair).toEqual(fixtures.ed25519.keypair)
  })

  it('deriveKeypair - secp256k1 - validator', () => {
    const keypair = deriveKeypair(fixtures.secp256k1.seed, {
      validator: true,
    })
    expect(keypair).toEqual(fixtures.secp256k1.validatorKeypair)
  })

  it('deriveKeypair - ed25519 - validator', () => {
    const keypair = deriveKeypair(fixtures.ed25519.seed, {
      validator: true,
    })
    expect(keypair).toEqual(fixtures.ed25519.validatorKeypair)
  })

  it('deriveAddress - secp256k1 public key', () => {
    const address = deriveAddress(fixtures.secp256k1.keypair.publicKey)
    expect(address).toEqual(fixtures.secp256k1.address)
  })

  it('deriveAddress - ed25519 public key', () => {
    const address = deriveAddress(fixtures.ed25519.keypair.publicKey)
    expect(address).toEqual(fixtures.ed25519.address)
  })

  it('sign - secp256k1', () => {
    const privateKey = fixtures.secp256k1.keypair.privateKey
    const message = fixtures.secp256k1.message
    const messageHex = Buffer.from(message, 'utf8').toString('hex')
    const signature = sign(messageHex, privateKey)
    expect(signature).toEqual(fixtures.secp256k1.signature)
  })

  it('verify - secp256k1', () => {
    const signature = fixtures.secp256k1.signature
    const publicKey = fixtures.secp256k1.keypair.publicKey
    const message = fixtures.secp256k1.message
    const messageHex = Buffer.from(message, 'utf8').toString('hex')
    expect(verify(messageHex, signature, publicKey)).toBeTruthy()
  })

  it('sign - ed25519', () => {
    const privateKey = fixtures.ed25519.keypair.privateKey
    const message = fixtures.ed25519.message
    const messageHex = Buffer.from(message, 'utf8').toString('hex')
    const signature = sign(messageHex, privateKey)
    expect(signature).toEqual(fixtures.ed25519.signature)
  })

  it('verify - ed25519', () => {
    const signature = fixtures.ed25519.signature
    const publicKey = fixtures.ed25519.keypair.publicKey
    const message = fixtures.ed25519.message
    const messageHex = Buffer.from(message, 'utf8').toString('hex')
    expect(verify(messageHex, signature, publicKey)).toBeTruthy()
  })

  it('deriveNodeAddress', () => {
    const addrX = 'n9KHn8NfbBsZV5q8bLfS72XyGqwFt5mgoPbcTV4c6qKiuPTAtXYk'
    const addrY = 'rU7bM9ENDkybaxNrefAVjdLTyNLuue1KaJ'
    expect(deriveNodeAddress(addrX)).toEqual(addrY)
  })

  it('Random Address', () => {
    const seed = generateSeed()
    const keypair = deriveKeypair(seed)
    const address = deriveAddress(keypair.publicKey)
    expect(address.startsWith('r')).toBeTruthy()
  })
})
