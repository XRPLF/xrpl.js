/* eslint-disable @typescript-eslint/no-magic-numbers -- Doing hex string parsing. */
import { hexToBytes } from '@xrplf/isomorphic/utils'
import BigNumber from 'bignumber.js'
import { encodeAccountID } from 'ripple-address-codec'

import { XrplError } from '../errors'

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
  /* eslint-disable no-bitwise -- XOR is part of the encode/decode scheme. */
  const seed = 384160001
  const increment = 2459
  const max = 4294967296

  const scramble = new BigNumber(seed)
    .multipliedBy(tokenSeq)
    .modulo(max)
    .plus(increment)
    .modulo(max)
    .toNumber()
  return (taxon ^ scramble) >>> 0
  /* eslint-enable no-bitwise */
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
 * @param nftokenID - A hex string which identifies an NFToken on the ledger.
 * @throws XrplError when given an invalid nftokenID.
 * @returns a decoded nftokenID with all fields encoded within.
 */
export default function parseNFTokenID(nftokenID: string): {
  NFTokenID: string
  Flags: number
  TransferFee: number
  Issuer: string
  Taxon: number
  Sequence: number
} {
  const expectedLength = 64
  if (nftokenID.length !== expectedLength) {
    throw new XrplError(`Attempting to parse a nftokenID with length ${nftokenID.length}
    , but expected a token with length ${expectedLength}`)
  }

  const scrambledTaxon = new BigNumber(
    nftokenID.substring(48, 56),
    16,
  ).toNumber()
  const sequence = new BigNumber(nftokenID.substring(56, 64), 16).toNumber()

  const NFTokenIDData = {
    NFTokenID: nftokenID,
    Flags: new BigNumber(nftokenID.substring(0, 4), 16).toNumber(),
    TransferFee: new BigNumber(nftokenID.substring(4, 8), 16).toNumber(),
    Issuer: encodeAccountID(hexToBytes(nftokenID.substring(8, 48))),
    Taxon: unscrambleTaxon(scrambledTaxon, sequence),
    Sequence: sequence,
  }

  return NFTokenIDData
}
