import { HDKey } from '@scure/bip32'
import { mnemonicToSeedSync, validateMnemonic } from '@scure/bip39'
import { wordlist } from '@scure/bip39/wordlists/english'
import { bytesToHex } from '@xrpl/crypto/utils'
import { encodeSeed } from 'ripple-address-codec'

import ECDSA from '../ECDSA'
import { ValidationError } from '../errors'

import { rfc1751MnemonicToKey } from './rfc1751'

import { Wallet } from './index'

const DEFAULT_DERIVATION_PATH = "m/44'/144'/0'/0/0"

type ValidHDKey = HDKey & {
  privateKey: Uint8Array
  publicKey: Uint8Array
}

function validateKey(node: HDKey): asserts node is ValidHDKey {
  if (!(node.privateKey instanceof Uint8Array)) {
    throw new ValidationError('Unable to derive privateKey from mnemonic input')
  }

  if (!(node.publicKey instanceof Uint8Array)) {
    throw new ValidationError('Unable to derive publicKey from mnemonic input')
  }
}

/**
 * Derives a wallet from a bip39 or RFC1751 mnemonic (Defaults to bip39).
 *
 * @deprecated since version 2.6.1.
 * Will be deleted in version 3.0.0.
 * This representation is currently deprecated in rippled.
 * You should use another method to represent your keys such as a seed or public/private keypair.
 *
 * @param mnemonic - A string consisting of words (whitespace delimited) used to derive a wallet.
 * @param opts - (Optional) Options to derive a Wallet.
 * @param opts.masterAddress - Include if a Wallet uses a Regular Key Pair. It must be the master address of the account.
 * @param opts.derivationPath - The path to derive a keypair (publicKey/privateKey). Only used for bip39 conversions.
 * @param opts.mnemonicEncoding - If set to 'rfc1751', this interprets the mnemonic as a rippled RFC1751 mnemonic like
 *                          `wallet_propose` generates in rippled. Otherwise the function defaults to bip39 decoding.
 * @param opts.algorithm - Only used if opts.mnemonicEncoding is 'rfc1751'. Allows the mnemonic to generate its
 *                         secp256k1 seed, or its ed25519 seed. By default, it will generate the secp256k1 seed
 *                         to match the rippled `wallet_propose` default algorithm.
 * @returns A Wallet derived from a mnemonic.
 * @throws ValidationError if unable to derive private key from mnemonic input.
 */
export function walletFromMnemonic(
  mnemonic: string,
  opts: {
    masterAddress?: string
    derivationPath?: string
    mnemonicEncoding?: 'bip39' | 'rfc1751'
    algorithm?: ECDSA
  } = {},
): Wallet {
  if (opts.mnemonicEncoding === 'rfc1751') {
    return walletFromRFC1751Mnemonic(mnemonic, {
      masterAddress: opts.masterAddress,
      algorithm: opts.algorithm,
    })
  }
  // Otherwise decode using bip39's mnemonic standard
  if (!validateMnemonic(mnemonic, wordlist)) {
    throw new ValidationError(
      'Unable to parse the given mnemonic using bip39 encoding',
    )
  }

  const seed = mnemonicToSeedSync(mnemonic)
  const masterNode = HDKey.fromMasterSeed(seed)
  const node = masterNode.derive(opts.derivationPath ?? DEFAULT_DERIVATION_PATH)
  validateKey(node)

  const publicKey = bytesToHex(node.publicKey)
  const privateKey = bytesToHex(node.privateKey)
  return new Wallet(publicKey, `00${privateKey}`, {
    masterAddress: opts.masterAddress,
  })
}

/**
 * Derives a wallet from a RFC1751 mnemonic, which is how `wallet_propose` encodes mnemonics.
 *
 * @param mnemonic - A string consisting of words (whitespace delimited) used to derive a wallet.
 * @param opts - (Optional) Options to derive a Wallet.
 * @param opts.masterAddress - Include if a Wallet uses a Regular Key Pair. It must be the master address of the account.
 * @param opts.algorithm - The digital signature algorithm to generate an address for.
 * @returns A Wallet derived from a mnemonic.
 */
export function walletFromRFC1751Mnemonic(
  mnemonic: string,
  opts: { masterAddress?: string; algorithm?: ECDSA },
): Wallet {
  const seed = rfc1751MnemonicToKey(mnemonic)
  let encodeAlgorithm: 'ed25519' | 'secp256k1'
  if (opts.algorithm === ECDSA.ed25519) {
    encodeAlgorithm = 'ed25519'
  } else {
    // Defaults to secp256k1 since that's the default for `wallet_propose`
    encodeAlgorithm = 'secp256k1'
  }
  const encodedSeed = encodeSeed(seed, encodeAlgorithm)
  return Wallet.fromSeed(encodedSeed, {
    masterAddress: opts.masterAddress,
    algorithm: opts.algorithm,
  })
}
