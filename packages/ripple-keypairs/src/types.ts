export type HexString = string
export type Algorithm = 'ecdsa-secp256k1' | 'ed25519'
export type KeyType = 'public' | 'private'
export type HexOrU8Array = HexString | Uint8Array

export interface KeyPair {
  /**
   * The private key as a hexadecimal string.
   * For Ed25519 keys, it is prefixed with '0xED'.
   *
   * @see {getAlgorithmFromKey}
   */
  privateKey: HexString
  /**
   * The public key as a hexadecimal string.
   * For Ed25519 keys, it is prefixed with '0xED'.
   *
   * @see {getAlgorithmFromKey}
   */
  publicKey: HexString
}

export interface DeriveKeyPairOptions {
  /**
   * If true, derive a key pair for a validator;
   * otherwise, derive a key pair for an account.
   * Default is false.
   */
  validator?: boolean
  /**
   * The index of the account within the family seed, used for deriving
   * different accounts from the same seed.
   * Default is 0.
   */
  accountIndex?: number
}

export interface SigningScheme {
  /**
   * Derives a key pair from the provided entropy and options.
   *
   * @param entropy - The entropy input for key derivation.
   * @param options - Optional parameters for key derivation.
   * @returns The derived key pair.
   */
  deriveKeypair: (
    entropy: HexOrU8Array,
    options?: DeriveKeyPairOptions,
  ) => KeyPair

  /**
   * Signs a message using the provided private key.
   *
   * @param message - The message to sign.
   * @param privateKey - The private key to use for signing.
   * @returns The signature as a hexadecimal string.
   */
  sign: (message: HexOrU8Array, privateKey: HexOrU8Array) => HexString

  /**
   * Verifies a signature against a message and public key.
   *
   * @param message - The message to verify.
   * @param signature - The signature to verify.
   * @param publicKey - The public key to use for verification.
   * @returns True if the signature is valid, false otherwise.
   */
  verify: (
    message: HexOrU8Array,
    signature: HexOrU8Array,
    publicKey: HexOrU8Array,
  ) => boolean
}
