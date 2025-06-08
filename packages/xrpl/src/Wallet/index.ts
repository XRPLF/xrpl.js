import { HDKey } from '@scure/bip32'
import { mnemonicToSeedSync, validateMnemonic } from '@scure/bip39'
import { wordlist } from '@scure/bip39/wordlists/english'
import { bytesToHex } from '@xrplf/isomorphic/utils'
import BigNumber from 'bignumber.js'
import {
  classicAddressToXAddress,
  isValidXAddress,
  xAddressToClassicAddress,
  encodeSeed,
} from 'ripple-address-codec'
import {
  encodeForSigning,
  encodeForMultisigning,
  encode,
} from 'ripple-binary-codec'
import {
  deriveAddress,
  deriveKeypair,
  generateSeed,
  sign,
} from 'ripple-keypairs'

import ECDSA from '../ECDSA'
import { ValidationError } from '../errors'
import { Transaction, validate } from '../models/transactions'
import { GlobalFlags } from '../models/transactions/common'
import { hasFlag } from '../models/utils'
import { ensureClassicAddress } from '../sugar/utils'
import { omitBy } from '../utils/collections'
import { hashSignedTx } from '../utils/hashes/hashLedger'

import { rfc1751MnemonicToKey } from './rfc1751'
import { verifySignature } from './signer'

const DEFAULT_ALGORITHM: ECDSA = ECDSA.ed25519
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
 * A utility for deriving a wallet composed of a keypair (publicKey/privateKey).
 * A wallet can be derived from either a seed, mnemonic, or entropy (array of random numbers).
 * It provides functionality to sign/verify transactions offline.
 *
 * @example
 * ```typescript
 *
 * // Derive a wallet from a base58 encoded seed.
 * const seedWallet = Wallet.fromSeed('ssZkdwURFMBXenJPbrpE14b6noJSu')
 * console.log(seedWallet)
 * // Wallet {
 * // publicKey: '02FE9932A9C4AA2AC9F0ED0F2B89302DE7C2C95F91D782DA3CF06E64E1C1216449',
 * // privateKey: '00445D0A16DD05EFAF6D5AF45E6B8A6DE4170D93C0627021A0B8E705786CBCCFF7',
 * // classicAddress: 'rG88FVLjvYiQaGftSa1cKuE2qNx7aK5ivo',
 * // seed: 'ssZkdwURFMBXenJPbrpE14b6noJSu'
 * // }.
 *
 * // Sign a JSON Transaction
 *  const signed = seedWallet.signTransaction({
 *      TransactionType: 'Payment',
 *      Account: 'rG88FVLjvYiQaGftSa1cKuE2qNx7aK5ivo'
 *      ...........
 * }).
 *
 * console.log(signed)
 * // '1200007321......B01BE1DFF3'.
 * console.log(decode(signed))
 * // {
 * //   TransactionType: 'Payment',
 * //   SigningPubKey: '02FE9932A9C4AA2AC9F0ED0F2B89302DE7C2C95F91D782DA3CF06E64E1C1216449',
 * //   TxnSignature: '3045022100AAD......5B631ABD21171B61B07D304',
 * //   Account: 'rG88FVLjvYiQaGftSa1cKuE2qNx7aK5ivo'
 * //   ...........
 * // }
 * ```
 *
 * @category Signing
 */
export class Wallet {
  public readonly publicKey: string
  public readonly privateKey: string
  public readonly classicAddress: string
  public readonly seed?: string

  /**
   * Creates a new Wallet.
   *
   * @param publicKey - The public key for the account.
   * @param privateKey - The private key used for signing transactions for the account.
   * @param opts - (Optional) Options to initialize a Wallet.
   * @param opts.masterAddress - Include if a Wallet uses a Regular Key Pair. It must be the master address of the account.
   * @param opts.seed - The seed used to derive the account keys.
   */
  public constructor(
    publicKey: string,
    privateKey: string,
    opts: {
      masterAddress?: string
      seed?: string
    } = {},
  ) {
    this.publicKey = publicKey
    this.privateKey = privateKey
    this.classicAddress = opts.masterAddress
      ? ensureClassicAddress(opts.masterAddress)
      : deriveAddress(publicKey)
    this.seed = opts.seed
  }

  /**
   * Alias for wallet.classicAddress.
   *
   * @returns The wallet's classic address.
   */
  public get address(): string {
    return this.classicAddress
  }

  /**
   * `generate()` creates a new random Wallet. In order to make this a valid account on ledger, you must
   * Send XRP to it. On test networks that can be done with "faucets" which send XRP to any account which asks
   * For it. You can call `client.fundWallet()` in order to generate credentials and fund the account on test networks.
   *
   * @example
   * ```ts
   * const { Wallet } = require('xrpl')
   * const wallet = Wallet.generate()
   * ```
   *
   * @param algorithm - The digital signature algorithm to generate an address for.
   * @returns A new Wallet derived from a generated seed.
   *
   * @throws ValidationError when signing algorithm isn't valid
   */
  public static generate(algorithm: ECDSA = DEFAULT_ALGORITHM): Wallet {
    if (!Object.values(ECDSA).includes(algorithm)) {
      throw new ValidationError('Invalid cryptographic signing algorithm')
    }
    const seed = generateSeed({ algorithm })
    return Wallet.fromSeed(seed, { algorithm })
  }

  /**
   * Derives a wallet from a seed.
   *
   * @param seed - A string used to generate a keypair (publicKey/privateKey) to derive a wallet.
   * @param opts - (Optional) Options to derive a Wallet.
   * @param opts.algorithm - The digital signature algorithm to generate an address for.
   * @param opts.masterAddress - Include if a Wallet uses a Regular Key Pair. It must be the master address of the account.
   * @returns A Wallet derived from a seed.
   */
  public static fromSeed(
    seed: string,
    opts: { masterAddress?: string; algorithm?: ECDSA } = {},
  ): Wallet {
    return Wallet.deriveWallet(seed, {
      algorithm: opts.algorithm,
      masterAddress: opts.masterAddress,
    })
  }

  /**
   * Derives a wallet from a secret (AKA a seed).
   *
   * @param secret - A string used to generate a keypair (publicKey/privateKey) to derive a wallet.
   * @param opts - (Optional) Options to derive a Wallet.
   * @param opts.algorithm - The digital signature algorithm to generate an address for.
   * @param opts.masterAddress - Include if a Wallet uses a Regular Key Pair. It must be the master address of the account.
   * @returns A Wallet derived from a secret (AKA a seed).
   */
  // eslint-disable-next-line @typescript-eslint/member-ordering -- Member is used as a function here
  public static fromSecret = Wallet.fromSeed

  /**
   * Derives a wallet from an entropy (array of random numbers).
   *
   * @param entropy - An array of random numbers to generate a seed used to derive a wallet.
   * @param opts - (Optional) Options to derive a Wallet.
   * @param opts.algorithm - The digital signature algorithm to generate an address for.
   * @param opts.masterAddress - Include if a Wallet uses a Regular Key Pair. It must be the master address of the account.
   * @returns A Wallet derived from an entropy.
   */
  public static fromEntropy(
    entropy: Uint8Array | number[],
    opts: { masterAddress?: string; algorithm?: ECDSA } = {},
  ): Wallet {
    const algorithm = opts.algorithm ?? DEFAULT_ALGORITHM
    const options = {
      entropy: Uint8Array.from(entropy),
      algorithm,
    }
    const seed = generateSeed(options)
    return Wallet.deriveWallet(seed, {
      algorithm,
      masterAddress: opts.masterAddress,
    })
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
  public static fromMnemonic(
    mnemonic: string,
    opts: {
      masterAddress?: string
      derivationPath?: string
      mnemonicEncoding?: 'bip39' | 'rfc1751'
      algorithm?: ECDSA
    } = {},
  ): Wallet {
    if (opts.mnemonicEncoding === 'rfc1751') {
      return Wallet.fromRFC1751Mnemonic(mnemonic, {
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
    const node = masterNode.derive(
      opts.derivationPath ?? DEFAULT_DERIVATION_PATH,
    )
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
  private static fromRFC1751Mnemonic(
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

  /**
   * Derive a Wallet from a seed.
   *
   * @param seed - The seed used to derive the wallet.
   * @param opts - (Optional) Options to derive a Wallet.
   * @param opts.algorithm - The digital signature algorithm to generate an address for.
   * @param opts.masterAddress - Include if a Wallet uses a Regular Key Pair. It must be the master address of the account.
   * @returns A Wallet derived from the seed.
   */
  private static deriveWallet(
    seed: string,
    opts: { masterAddress?: string; algorithm?: ECDSA } = {},
  ): Wallet {
    const { publicKey, privateKey } = deriveKeypair(seed, {
      algorithm: opts.algorithm ?? DEFAULT_ALGORITHM,
    })
    return new Wallet(publicKey, privateKey, {
      seed,
      masterAddress: opts.masterAddress,
    })
  }

  /**
   * Signs a transaction offline.
   *
   * @example
   *
   * ```ts
   * const { Client, Wallet } = require('xrpl')
   * const client = new Client('wss://s.altnet.rippletest.net:51233')
   *
   * async function signTransaction() {
   *   await client.connect()
   *   const { balance: balance1, wallet: wallet1 } = client.fundWallet()
   *   const { balance: balance2, wallet: wallet2 } = client.fundWallet()
   *
   *   const transaction = {
   *     TransactionType: 'Payment',
   *     Account: wallet1.address,
   *     Destination: wallet2.address,
   *     Amount: '10'
   *   }
   *
   *   try {
   *     await client.autofill(transaction)
   *     const { tx_blob: signed_tx_blob, hash} = await wallet1.sign(transaction)
   *     console.log(signed_tx_blob)
   *   } catch (error) {
   *     console.error(`Failed to sign transaction: ${error}`)
   *   }
   *   const result = await client.submit(signed_tx_blob)
   *   await client.disconnect()
   * }
   *
   * signTransaction()
   * ```
   * In order for a transaction to be validated, it must be signed by the account sending the transaction to prove
   * That the owner is actually the one deciding to take that action.
   *
   * In this example, we created, signed, and then submitted a transaction to testnet. You may notice that the
   * Output of `sign` includes a `tx_blob` and a `hash`, both of which are needed to submit & verify the results.
   * Note: If you pass a `Wallet` to `client.submit` or `client.submitAndWait` it will do signing like this under the hood.
   *
   * `tx_blob` is a binary representation of a transaction on the XRP Ledger. It's essentially a byte array
   * that encodes all of the data necessary to execute the transaction, including the source address, the destination
   * address, the amount, and any additional fields required for the specific transaction type.
   *
   * `hash` is a unique identifier that's generated from the signed transaction data on the XRP Ledger. It's essentially
   * A cryptographic digest of the signed transaction blob, created using a hash function. The signed transaction hash is
   * Useful for identifying and tracking specific transactions on the XRP Ledger. It can be used to query transaction
   * Information, verify the authenticity of a transaction, and detect any tampering with the transaction data.
   *
   * @param this - Wallet instance.
   * @param transaction - A transaction to be signed offline.
   * @param multisign - Specify true/false to use multisign or actual address (classic/x-address) to make multisign tx request.
   *                    The actual address is only needed in the case of regular key usage.
   * @returns A signed transaction.
   * @throws ValidationError if the transaction is already signed or does not encode/decode to same result.
   * @throws XrplError if the issued currency being signed is XRP ignoring case.
   */
  // eslint-disable-next-line max-lines-per-function -- introduced more checks to support both string and boolean inputs.
  public sign(
    this: Wallet,
    transaction: Transaction,
    multisign?: boolean | string,
  ): {
    tx_blob: string
    hash: string
  } {
    let multisignAddress: boolean | string = false
    if (typeof multisign === 'string') {
      multisignAddress = multisign
    } else if (multisign) {
      multisignAddress = this.classicAddress
    }

    // clean null & undefined valued tx properties
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- ensure Transaction flows through
    const tx = omitBy(
      { ...transaction },
      (value) => value == null,
    ) as unknown as Transaction

    if (tx.TxnSignature || tx.Signers) {
      throw new ValidationError(
        'txJSON must not contain "TxnSignature" or "Signers" properties',
      )
    }

    removeTrailingZeros(tx)

    /*
     * This will throw a more clear error for JS users if the supplied transaction has incorrect formatting
     */
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- validate does not accept Transaction type
    validate(tx as unknown as Record<string, unknown>)
    if (hasFlag(tx, GlobalFlags.tfInnerBatchTxn, 'tfInnerBatchTxn')) {
      throw new ValidationError('Cannot sign a Batch inner transaction.')
    }

    const txToSignAndEncode = { ...tx }

    if (multisignAddress) {
      txToSignAndEncode.SigningPubKey = ''
      const signer = {
        Account: multisignAddress,
        SigningPubKey: this.publicKey,
        TxnSignature: computeSignature(
          txToSignAndEncode,
          this.privateKey,
          multisignAddress,
        ),
      }
      txToSignAndEncode.Signers = [{ Signer: signer }]
    } else {
      txToSignAndEncode.SigningPubKey = this.publicKey
      txToSignAndEncode.TxnSignature = computeSignature(
        txToSignAndEncode,
        this.privateKey,
      )
    }

    const serialized = encode(txToSignAndEncode)
    return {
      tx_blob: serialized,
      hash: hashSignedTx(serialized),
    }
  }

  /**
   * Verifies a signed transaction offline.
   *
   * @param signedTransaction - A signed transaction (hex string of signTransaction result) to be verified offline.
   * @returns Returns true if a signedTransaction is valid.
   * @throws {Error} Transaction is missing a signature, TxnSignature
   */
  public verifyTransaction(signedTransaction: Transaction | string): boolean {
    return verifySignature(signedTransaction, this.publicKey)
  }

  /**
   * Gets an X-address in Testnet/Mainnet format.
   *
   * @param tag - A tag to be included within the X-address.
   * @param isTestnet - A boolean to indicate if X-address should be in Testnet (true) or Mainnet (false) format.
   * @returns An X-address.
   */
  public getXAddress(tag: number | false = false, isTestnet = false): string {
    return classicAddressToXAddress(this.classicAddress, tag, isTestnet)
  }
}

/**
 * Signs a transaction with the proper signing encoding.
 *
 * @param tx - A transaction to sign.
 * @param privateKey - A key to sign the transaction with.
 * @param signAs - Multisign only. An account address to include in the Signer field.
 * Can be either a classic address or an XAddress.
 * @returns A signed transaction in the proper format.
 */
function computeSignature(
  tx: Transaction,
  privateKey: string,
  signAs?: string,
): string {
  if (signAs) {
    const classicAddress = isValidXAddress(signAs)
      ? xAddressToClassicAddress(signAs).classicAddress
      : signAs

    return sign(encodeForMultisigning(tx, classicAddress), privateKey)
  }
  return sign(encodeForSigning(tx), privateKey)
}

/**
 * Remove trailing insignificant zeros for non-XRP Payment amount.
 * This resolves the serialization mismatch bug when encoding/decoding a non-XRP Payment transaction
 * with an amount that contains trailing insignificant zeros; for example, '123.4000' would serialize
 * to '123.4' and cause a mismatch.
 *
 * @param tx - The transaction prior to signing.
 */
function removeTrailingZeros(tx: Transaction): void {
  if (
    tx.TransactionType === 'Payment' &&
    typeof tx.Amount !== 'string' &&
    tx.Amount.value.includes('.') &&
    tx.Amount.value.endsWith('0')
  ) {
    // eslint-disable-next-line no-param-reassign -- Required to update Transaction.Amount.value
    tx.Amount = { ...tx.Amount }
    // eslint-disable-next-line no-param-reassign -- Required to update Transaction.Amount.value
    tx.Amount.value = new BigNumber(tx.Amount.value).toString()
  }
}
