import BigNumber from 'bignumber.js'
import { encodeAccountID } from 'ripple-address-codec'
import { XrplError } from '../errors'

/**
 * All information encoded within an NFTokenID.
 */
interface NFTokenID {
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

/**
 * An issuer may issue several NFTs with the same taxon; to ensure that NFTs are
 * spread across multiple pages we lightly mix the taxon up by using the sequence
 * (which is not under the issuer's direct control) as the seed for a simple linear
 * congruential generator.
 *
 * From the Hull-Dobell theorem we know that f(x)=(m*x+c) mod n will yield a
 * permutation of [0, n) when n is a power of 2 if m is congruent to 1 mod 4 and
 * c is odd. By doing a bitwise XOR with this permutation we can scramble/unscramble
 * the taxon.
 *
 * The XLS-20d proposal fixes m = 384160001 and c = 2459.
 * We then take the modulus of 2^32 which is 4294967296.
 *
 * @param taxon - The scrambled or unscrambled taxon (The XOR is both the encoding and decoding)
 * @param tokenSeq - The account sequence when the token was minted. Used as a psuedorandom seed.
 * @returns the opposite taxon. If the taxon was scrambled it becomes unscrambled, and vice versa.
 */
function unscrambleTaxon(taxon: number, tokenSeq: number): number {
  return (taxon ^ (384160001 * tokenSeq + 2459)) % 4294967296
}

/**
 * Parses an NFTokenID into the information it is encoding.
 *
 * Example decoding:
 *
 * 000B 0539 C35B55AA096BA6D87A6E6C965A6534150DC56E5E 12C5D09E 0000000C
 * +--- +--- +--------------------------------------- +------- +-------
 * |    |    |                                        |        |
 * |    |    |                                        |        `---> Sequence: 12
 * |    |    |                                        |
 * |    |    |                                        `---> Scrambled Taxon: 314,953,886
 * |    |    |                                              Unscrambled Taxon: 1337
 * |    |    |
 * |    |    `---> Issuer: rJoxBSzpXhPtAuqFmqxQtGKjA13jUJWthE
 * |    |
 * |    `---> TransferFee: 1337.0 bps or 13.37%
 * |
 * `---> Flags: 11 -> lsfBurnable, lsfOnlyXRP and lsfTransferable
 *
 * @param tokenID - A hex string which identifies an NFToken on the ledger.
 * @returns a decoded tokenID with all information encoded within.
 */
function parseNFTokenID(tokenID: string): NFTokenID {
  const expectedLength = 64
  if (tokenID.length != expectedLength) {
    throw new XrplError(`Attempting to parse a tokenID with length ${tokenID.length}
    , but expected a token with length ${expectedLength}`)
  }

  const scrambledTaxon = new BigNumber(tokenID.substring(48, 56), 16).toNumber()
  const sequence = new BigNumber(tokenID.substring(56, 64), 16).toNumber()

  const NFTokenIDData: NFTokenID = {
    TokenID: tokenID,
    Flags: new BigNumber(tokenID.substring(0, 4), 16).toNumber(),
    TransferFee: new BigNumber(tokenID.substring(4, 8), 16).toNumber(), // basis points (bps)
    Issuer: encodeAccountID(Buffer.from(tokenID.substring(8, 48), 'hex')),
    Taxon: unscrambleTaxon(scrambledTaxon, sequence),
    Sequence: sequence,
  }

  return NFTokenIDData
}

export { parseNFTokenID, NFTokenID }
