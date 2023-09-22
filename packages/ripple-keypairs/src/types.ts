export type ByteArray = number[] | Uint8Array
export type HexString = string
export type Algorithm = 'ecdsa-secp256k1' | 'ed25519'
export type KeyType = 'public' | 'private'

export interface KeyPair {
  privateKey: HexString
  publicKey: HexString
}

export interface DeriveKeyPairOptions {
  validator?: boolean
  accountIndex?: number
}

export interface SigningMethod {
  deriveKeypair: (entropy: ByteArray, options?: DeriveKeyPairOptions) => KeyPair

  sign: (
    // TODO: HexString?
    message: Uint8Array,
    privateKey: HexString,
  ) => HexString

  verify: (
    // TODO: HexString?
    message: Uint8Array,
    signature: HexString,
    publicKey: HexString,
  ) => boolean
}
