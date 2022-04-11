/**
 * All information encoded within an NFTokenID.
 */
export default interface NFTokenID {
  /** The encoded hex string which represents an NFToken on ledger. */
  TokenID: string
  /** Which flags were enabled when the token was minted. */
  Flags: number
  /** The fee given to the minter on each trade of this NFToken in basis points. */
  TransferFee: number
  /** The original creator of this NFT. */
  Issuer: string
  /** A number associated with the token chosen by the minter. */
  Taxon: number
  /** The sequence number of the transaction which minted this token. */
  Sequence: number
}
