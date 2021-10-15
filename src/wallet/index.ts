import { fromSeed } from 'bip32'
import { mnemonicToSeedSync } from 'bip39'
import _ from 'lodash'
import {
  classicAddressToXAddress,
  isValidXAddress,
  xAddressToClassicAddress,
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

import ECDSA from '../ecdsa'
import { ValidationError } from '../errors'
import { Transaction } from '../models/transactions'
import { ensureClassicAddress } from '../sugar/utils'
import { hashSignedTx } from '../utils/hashes/ledgerHash'

const DEFAULT_ALGORITHM: ECDSA = ECDSA.ed25519
const DEFAULT_DERIVATION_PATH = "m/44'/144'/0'/0/0"

function hexFromBuffer(buffer: Buffer): string {
  return buffer.toString('hex').toUpperCase()
}
interface SignedTxBlobHash {
  tx_blob: string
  hash: string
}

interface WalletBaseOptions {
  // Include if a wallet uses a Regular Key Pair. It must be the master address of the account.
  masterAddress?: string
}

interface WalletOptions extends WalletBaseOptions {
  // The seed used to derive the account keys.
  seed?: string
}

interface DeriveWalletOptions extends WalletBaseOptions {
  // The digital signature algorithm to generate an address for.
  algorithm?: ECDSA
}

interface FromMnemonicOptions extends WalletBaseOptions {
  // The path to derive a keypair (publicKey/privateKey) used for mnemonic-to-seed conversion.
  derivationPath?: string
}

/**
 * A utility for deriving a wallet composed of a keypair (publicKey/privateKey).
 * A wallet can be derived from either a seed, mnemonic, or entropy (array of random numbers).
 * It provides functionality to sign/verify transactions offline.
 *
 * @example
 * ```typescript
 * // Derive a wallet from a bip38 Mnemonic
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
 * @category Offline Signing
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
    opts: WalletOptions = {},
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
  public static fromSeed(seed: string, opts: DeriveWalletOptions = {}): Wallet {
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
   * Derives a wallet from a mnemonic.
   *
   * @param mnemonic - A string consisting of words (whitespace delimited) used to derive a wallet.
   * @param opts - (Optional) Options to derive a Wallet.
   * @param opts.derivationPath - The path to derive a keypair (publicKey/privateKey) used for mnemonic-to-seed conversion.
   * @param opts.masterAddress - Include if a Wallet uses a Regular Key Pair. It must be the master address of the account.
   * @returns A Wallet derived from a mnemonic.
   * @throws ValidationError if unable to derive private key from mnemonic input.
   */
  public static fromMnemonic(
    mnemonic: string,
    opts: FromMnemonicOptions = {},
  ): Wallet {
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
    opts: DeriveWalletOptions = {},
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
    opts: DeriveWalletOptions = {},
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
   */
  // eslint-disable-next-line max-lines-per-function -- introduced more checks to support both string and boolean inputs.
  public sign(
    this: Wallet,
    transaction: Transaction,
    multisign?: boolean | string,
  ): SignedTxBlobHash {
    let multisignAddress: boolean | string = false
    if (typeof multisign === 'string' && multisign.startsWith('X')) {
      multisignAddress = multisign
    } else if (multisign) {
      multisignAddress = this.getClassicAddress()
    }

    if (transaction.TxnSignature || transaction.Signers) {
      throw new ValidationError(
        'txJSON must not contain "TxnSignature" or "Signers" properties',
      )
    }

    const txToSignAndEncode = { ...transaction }

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
    this.checkTxSerialization(serialized, transaction)
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
  public verifyTransaction(signedTransaction: string): boolean {
    const tx = decode(signedTransaction)
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
   * Gets the classic address of the account this wallet represents. This only is correct if this wallet corresponds
   * to your [master keypair](https://xrpl.org/cryptographic-keys.html#master-key-pair). If this wallet represents a
   * [regular keypair](https://xrpl.org/cryptographic-keys.html#regular-key-pair) this will provide an incorrect address.
   *
   * @returns A classic address.
   */
  public getClassicAddress(): string {
    return this.classicAddress
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
   */
  // eslint-disable-next-line class-methods-use-this -- Helper for organization purposes
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
        memoCopy.Memo.MemoData = memo.Memo.MemoData.toUpperCase()
      }

      if (memo.Memo.MemoType) {
        memoCopy.Memo.MemoType = memo.Memo.MemoType.toUpperCase()
      }

      if (memo.Memo.MemoFormat) {
        memoCopy.Memo.MemoFormat = memo.Memo.MemoFormat.toUpperCase()
      }

      return memo
    })
    if (!_.isEqual(decoded, tx)) {
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

export default Wallet
