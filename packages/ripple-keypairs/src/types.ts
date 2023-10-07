export type HexString = string
export type Algorithm = 'ecdsa-secp256k1' | 'ed25519'
export type KeyType = 'private' | 'public'

export interface KeyPair {
  privateKey: HexString
  publicKey: HexString
}

export interface DeriveKeyPairOptions {
  validator?: boolean
  accountIndex?: number
}

export interface SigningScheme {
  deriveKeypair: (
    entropy: Uint8Array,
    options?: DeriveKeyPairOptions,
  ) => KeyPair

  sign: (
    // deriveKeyPair creates a Sha512.half as Uint8Array so that's why it takes this
    // though it /COULD/ take HexString as well
    // for consistency it should be Uint8Array | HexString everywhere,
    // or HexString everywhere
    message: Uint8Array,
    privateKey: HexString,
  ) => HexString

  verify: (
    message: Uint8Array,
    signature: HexString,
    publicKey: HexString,
  ) => boolean
}
