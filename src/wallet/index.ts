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

const DEFAULT_ALGORITHM: ECDSA = ECDSA.ed25519
const DEFAULT_DERIVATION_PATH = "m/44'/144'/0'/0/0"

function hexFromBuffer(buffer: Buffer): string {
  return buffer.toString('hex').toUpperCase()
}

interface WalletBaseOptions {
  // Include if making a wallet for a Regular Key Pair. This should be the classicAddress of the account.
  classicAddress?: string
}

interface WalletOptions extends WalletBaseOptions {
  // The seed used to derive the account keys.
  seed?: string
}

interface FromSeedOptions extends WalletBaseOptions {
  // The digital signature algorithm to generate an address for.
  algorithm?: ECDSA
}

interface FromMnemonicOptions extends WalletBaseOptions {
  // The path to derive a keypair (publicKey/privateKey) from a seed (that was converted from a mnemonic).
  derivationPath?: string
}

interface FromEntropyOptions extends WalletBaseOptions {
  // The digital signature algorithm to generate an address for.
  algorithm?: ECDSA
}

interface DeriveWalletOptions extends WalletBaseOptions {
  // The digital signature algorithm to generate an address for.
  algorithm?: ECDSA
}

/**
 * A utility for deriving a wallet composed of a keypair (publicKey/privateKey).
 * A wallet can be derived from either a seed, mnemnoic, or entropy (array of random numbers).
 * It provides functionality to sign/verify transactions offline.
 */
class Wallet {
  public readonly publicKey: string
  public readonly privateKey: string
  public readonly classicAddress: string
  public readonly seed?: string

  /**
   * Creates a new Wallet.
   *
   * @param publicKey - The public key for the account.
   * @param privateKey - The private key used for signing transactions for the account.
   * @param opts - (Optional) The seed and classicAddress (corresponding to its Regular Key Pair) for the account.
   */
  public constructor(
    publicKey: string,
    privateKey: string,
    opts: WalletOptions = {},
  ) {
    this.publicKey = publicKey
    this.privateKey = privateKey
    this.classicAddress = opts.classicAddress ?? deriveAddress(publicKey)
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
   * @param opts - (Optional) The algorithm (to derive the wallet) and classicAddress (corresponding to its Regular Key Pair).
   * @returns A Wallet derived from a seed.
   */
  public static fromSeed(seed: string, opts: FromSeedOptions = {}): Wallet {
    return Wallet.deriveWallet(seed, {
      algorithm: opts.algorithm,
      classicAddress: opts.classicAddress,
    })
  }

  /**
   * Derives a wallet from a secret (AKA a seed).
   *
   * @param secret - A string used to generate a keypair (publicKey/privateKey) to derive a wallet.
   * @param opts - (Optional) The algorithm (to derive the wallet) and classicAddress (corresponding to its Regular Key Pair).
   * @returns A Wallet derived from a secret (AKA a seed).
   */
  // eslint-disable-next-line @typescript-eslint/member-ordering -- Member is used as a function here
  public static fromSecret = Wallet.fromSeed

  /**
   * Derives a wallet from a mnemonic.
   *
   * @param mnemonic - A string consisting of words (whitespace delimited) used to derive a wallet.
   * @param opts - (Optional) The derivationPath and classicAddress (corresponding to its Regular Key Pair).
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
      classicAddress: opts.classicAddress,
    })
  }

  /**
   * Derives a wallet from an entropy (array of random numbers).
   *
   * @param entropy - An array of random numbers to generate a seed used to derive a wallet.
   * @param opts - (Optional) The algorithm (to derive the wallet) and classicAddress (corresponding to its Regular Key Pair).
   * @returns A Wallet derived from an entropy.
   */
  public static fromEntropy(
    entropy: Uint8Array | number[],
    opts: FromEntropyOptions = {},
  ): Wallet {
    const algorithm = opts.algorithm ?? DEFAULT_ALGORITHM
    const options = {
      entropy: Uint8Array.from(entropy),
      algorithm,
    }
    const seed = generateSeed(options)
    return Wallet.deriveWallet(seed, {
      algorithm,
      classicAddress: opts.classicAddress,
    })
  }

  /**
   * Derive a Wallet from a seed.
   *
   * @param seed - The seed used to derive the wallet.
   * @param opts - (Optional) The algorithm (to derive the wallet) and classicAddress (corresponding to its Regular Key Pair).
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
      classicAddress: opts.classicAddress,
    })
  }

  /**
   * Signs a transaction offline.
   *
   * @param this - Wallet instance.
   * @param transaction - A transaction to be signed offline.
   * @param multisignAddress - Multisign only. An account address corresponding to the multi-signature being added. If this
   * wallet represents your [master keypair](https://xrpl.org/cryptographic-keys.html#master-key-pair) you can get your account address
   * with the Wallet.getClassicAddress() function.
   * @returns A signed transaction.
   * @throws ValidationError if the transaction is already signed or does not encode/decode to same result.
   */
  public signTransaction(
    this: Wallet,
    transaction: Transaction,
    multisignAddress?: string,
  ): string {
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
    return serialized
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

    // ...And ensure it is equal to the original tx, except:
    // - It must have a TxnSignature or Signers (multisign).
    if (!decoded.TxnSignature && !decoded.Signers) {
      throw new ValidationError(
        'Serialized transaction must have a TxnSignature or Signers property',
      )
    }
    // - We know that the original tx did not have TxnSignature, so we should delete it:
    delete decoded.TxnSignature
    // - We know that the original tx did not have Signers, so if it exists, we should delete it:
    delete decoded.Signers

    // - If SigningPubKey was not in the original tx, then we should delete it.
    //   But if it was in the original tx, then we should ensure that it has not been changed.
    if (!tx.SigningPubKey) {
      delete decoded.SigningPubKey
    }

    // - Memos have exclusively hex data which should ignore case.
    //   Since decode goes to upper case, we set all tx memos to be uppercase for the comparison.
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
