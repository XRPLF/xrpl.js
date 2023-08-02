export type ByteEncodedString = string
export type Input = Uint8Array | number[] | ByteEncodedString

export interface Hash {
  update: (bytes: Input) => this
  digest: () => Uint8Array
}

export interface HashFn {
  (input: Input): Uint8Array
  create: () => Hash
}
