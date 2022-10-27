/* eslint-disable max-lines -- There are lots of equivalent constructors which make sense to have here. */
import BigNumber from 'bignumber.js'
import { fromSeed } from 'bip32'
import { mnemonicToSeedSync, validateMnemonic } from 'bip39'
import _ from 'lodash'
import {
  classicAddressToXAddress,
  isValidXAddress,
  xAddressToClassicAddress,
  encodeSeed,
} from 'ripple-address-codec'
import {
  decode,
  encodeForSigning,
  encodeForMultisigning,
  encode,
} from 'ripple-binary-codec'
import {
  deriveAddress,
  deriveKeypair,
  generateSeed,
  verify,
  sign,
} from 'ripple-keypairs'

import ECDSA from '../ECDSA'
import { ValidationError, XrplError } from '../errors'
import { IssuedCurrencyAmount } from '../models/common'
import { Transaction } from '../models/transactions'
import { isIssuedCurrency } from '../models/transactions/common'
import { isHex } from '../models/utils'
import { ensureClassicAddress } from '../sugar/utils'
import { hashSignedTx } from '../utils/hashes/hashLedger'

import { rfc1751MnemonicToKey } from './rfc1751'

const DEFAULT_ALGORITHM: ECDSA = ECDSA.ed25519
const DEFAULT_DERIVATION_PATH = "m/44'/144'/0'/0/0"

function hexFromBuffer(buffer: Buffer): string {
  return buffer.toString('hex').toUpperCase()
}

/**
 * A utility for deriving a wallet composed of a keypair (publicKey/privateKey).
 * A wallet can be derived from either a seed, mnemonic, or entropy (array of random numbers).
 * It provides functionality to sign/verify transactions offline.
 *
 * @example
 * ```typescript
 * // Derive a wallet from a bip39 Mnemonic
 * const wallet = Wallet.fromMnemonic(
 *   'jewel insect retreat jump claim horse second chef west gossip bone frown exotic embark laundry'
 * )
 * console.log(wallet)
 * // Wallet {
 * // publicKey: '02348F89E9A6A3615BA317F8474A3F51D66221562D3CA32BFA8D21348FF67012B2',
 * // privateKey: '00A8F2E77FC0E05890C1B5088AFE0ECF9D96466A4419B897B1AB383E336E1735A2',
 * // classicAddress: 'rwZiksrExmVkR64pf87Jor4cYbmff47SUm',
 * // seed: undefined
 * // }.
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
class Wallet {
  public readonly publicKey: string
  public readonly privateKey: string
  public readonly classicAddress: string
  public readonly seed?: string

  /**
   * Alias for wallet.classicAddress.
   *
   * @returns The wallet's classic address.
   */
  public get address(): string {
    return this.classicAddress
  }

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
   * Generates a new Wallet using a generated seed.
   *
   * @param algorithm - The digital signature algorithm to generate an address for.
   * @returns A new Wallet derived from a generated seed.
   */
  public static generate(algorithm: ECDSA = DEFAULT_ALGORITHM): Wallet {
    const seed = generateSeed({ algorithm })
    return Wallet.fromSeed(seed)
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
    if (!validateMnemonic(mnemonic)) {
      throw new ValidationError(
        'Unable to parse the given mnemonic using bip39 encoding',
      )
    }

    const seed = mnemonicToSeedSync(mnemonic)
    const masterNode = fromSeed(seed)
    const node = masterNode.derivePath(
      opts.derivationPath ?? DEFAULT_DERIVATION_PATH,
    )
    if (node.privateKey === undefined) {
      throw new ValidationError(
        'Unable to derive privateKey from mnemonic input',
      )
    }

    const publicKey = hexFromBuffer(node.publicKey)
    const privateKey = hexFromBuffer(node.privateKey)
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
   * @param this - Wallet instance.
   * @param transaction - A transaction to be signed offline.
   * @param multisign - Specify true/false to use multisign or actual address (classic/x-address) to make multisign tx request.
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
    if (typeof multisign === 'string' && multisign.startsWith('X')) {
      multisignAddress = multisign
    } else if (multisign) {
      multisignAddress = this.classicAddress
    }

    const tx = { ...transaction }

    if (tx.TxnSignature || tx.Signers) {
      throw new ValidationError(
        'txJSON must not contain "TxnSignature" or "Signers" properties',
      )
    }

    removeTrailingZeros(tx)

    const txToSignAndEncode = { ...tx }

    txToSignAndEncode.SigningPubKey = multisignAddress ? '' : this.publicKey

    if (multisignAddress) {
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
      txToSignAndEncode.TxnSignature = computeSignature(
        txToSignAndEncode,
        this.privateKey,
      )
    }

    const serialized = encode(txToSignAndEncode)
    this.checkTxSerialization(serialized, tx)
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
   */
  public verifyTransaction(signedTransaction: Transaction | string): boolean {
    const tx =
      typeof signedTransaction === 'string'
        ? decode(signedTransaction)
        : signedTransaction
    const messageHex: string = encodeForSigning(tx)
    const signature = tx.TxnSignature
    return verify(messageHex, signature, this.publicKey)
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

  /**
   *  Decode a serialized transaction, remove the fields that are added during the signing process,
   *  and verify that it matches the transaction prior to signing. This gives the user a sanity check
   *  to ensure that what they try to encode matches the message that will be recieved by rippled.
   *
   * @param serialized - A signed and serialized transaction.
   * @param tx - The transaction prior to signing.
   * @throws A ValidationError if the transaction does not have a TxnSignature/Signers property, or if
   * the serialized Transaction desn't match the original transaction.
   * @throws XrplError if the transaction includes an issued currency which is equivalent to XRP ignoring case.
   */
  // eslint-disable-next-line class-methods-use-this, max-lines-per-function -- Helper for organization purposes
  private checkTxSerialization(serialized: string, tx: Transaction): void {
    // Decode the serialized transaction:
    const decoded = decode(serialized)
    const txCopy = { ...tx }

    /*
     * And ensure it is equal to the original tx, except:
     * - It must have a TxnSignature or Signers (multisign).
     */
    if (!decoded.TxnSignature && !decoded.Signers) {
      throw new ValidationError(
        'Serialized transaction must have a TxnSignature or Signers property',
      )
    }
    // - We know that the original tx did not have TxnSignature, so we should delete it:
    delete decoded.TxnSignature
    // - We know that the original tx did not have Signers, so if it exists, we should delete it:
    delete decoded.Signers

    /*
     * - If SigningPubKey was not in the original tx, then we should delete it.
     *   But if it was in the original tx, then we should ensure that it has not been changed.
     */
    if (!tx.SigningPubKey) {
      delete decoded.SigningPubKey
    }

    /*
     * - Memos have exclusively hex data which should ignore case.
     *   Since decode goes to upper case, we set all tx memos to be uppercase for the comparison.
     */
    txCopy.Memos?.map((memo) => {
      const memoCopy = { ...memo }
      if (memo.Memo.MemoData) {
        if (!isHex(memo.Memo.MemoData)) {
          throw new ValidationError('MemoData field must be a hex value')
        }
        memoCopy.Memo.MemoData = memo.Memo.MemoData.toUpperCase()
      }

      if (memo.Memo.MemoType) {
        if (!isHex(memo.Memo.MemoType)) {
          throw new ValidationError('MemoType field must be a hex value')
        }
        memoCopy.Memo.MemoType = memo.Memo.MemoType.toUpperCase()
      }

      if (memo.Memo.MemoFormat) {
        if (!isHex(memo.Memo.MemoFormat)) {
          throw new ValidationError('MemoFormat field must be a hex value')
        }
        memoCopy.Memo.MemoFormat = memo.Memo.MemoFormat.toUpperCase()
      }

      return memo
    })

    if (txCopy.TransactionType === 'NFTokenMint' && txCopy.URI) {
      if (!isHex(txCopy.URI)) {
        throw new ValidationError('URI must be a hex value')
      }
      txCopy.URI = txCopy.URI.toUpperCase()
    }

    /* eslint-disable @typescript-eslint/consistent-type-assertions -- We check at runtime that this is safe */
    Object.keys(txCopy).forEach((key) => {
      const standard_currency_code_len = 3
      if (txCopy[key] && isIssuedCurrency(txCopy[key])) {
        const decodedAmount = decoded[key] as unknown as IssuedCurrencyAmount
        const decodedCurrency = decodedAmount.currency
        const txCurrency = (txCopy[key] as IssuedCurrencyAmount).currency

        if (
          txCurrency.length === standard_currency_code_len &&
          txCurrency.toUpperCase() === 'XRP'
        ) {
          throw new XrplError(
            `Trying to sign an issued currency with a similar standard code to XRP (received '${txCurrency}'). XRP is not an issued currency.`,
          )
        }

        // Standardize the format of currency codes to the 40 byte hex string for comparison
        const amount = txCopy[key] as IssuedCurrencyAmount
        if (amount.currency.length !== decodedCurrency.length) {
          /* eslint-disable-next-line max-depth -- Easier to read with two if-statements */
          if (decodedCurrency.length === standard_currency_code_len) {
            decodedAmount.currency = isoToHex(decodedCurrency)
          } else {
            /* eslint-disable-next-line @typescript-eslint/no-unsafe-member-access -- We need to update txCopy directly */
            txCopy[key].currency = isoToHex(txCopy[key].currency)
          }
        }
      }
    })
    /* eslint-enable @typescript-eslint/consistent-type-assertions -- Done with dynamic checking */

    if (!_.isEqual(decoded, txCopy)) {
      const data = {
        decoded,
        tx,
      }
      const error = new ValidationError(
        'Serialized transaction does not match original txJSON. See error.data',
        data,
      )
      throw error
    }
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

/**
 * Convert an ISO code to a hex string representation
 *
 * @param iso - A 3 letter standard currency code
 */
/* eslint-disable @typescript-eslint/no-magic-numbers -- Magic numbers are from rippleds of currency code encoding */
function isoToHex(iso: string): string {
  const bytes = Buffer.alloc(20)
  if (iso !== 'XRP') {
    const isoBytes = iso.split('').map((chr) => chr.charCodeAt(0))
    bytes.set(isoBytes, 12)
  }
  return bytes.toString('hex').toUpperCase()
}
/* eslint-enable @typescript-eslint/no-magic-numbers -- Only needed in this function */

export default Wallet
