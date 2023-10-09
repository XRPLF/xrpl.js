export type ByteEncodedString = string
export type Input = Uint8Array | number[] | ByteEncodedString

/**
 * A stripped down isomorphic hash inspired by node's `crypto.Hash`
 */
export interface Hash {
  /**
   * Updates the hash content with the given data,
   *
   * @param data - a byte encoded string, an array of numbers or a Uint8Array
   */
  update: (data: Input) => this
  /**
   * Calculates the digest of all the data passed to be hashed and returns a Uint8Array
   */
  digest: () => Uint8Array
}

export interface HashFn {
  /**
   * Produces a Uint8Array for the given hash contents
   * Shorthand for calling `create`, `update`, and then `digest`
   *
   * @param data - a byte encoded string, an array of numbers or a Uint8Array
   */
  (data: Input): Uint8Array

  /**
   * Creates a new empty `Hash`.
   */
  create: () => Hash
}
