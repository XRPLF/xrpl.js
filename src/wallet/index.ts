import { fromSeed } from 'bip32'
import { mnemonicToSeedSync } from 'bip39'
import { classicAddressToXAddress } from 'ripple-address-codec'
import { decode, encodeForSigning } from 'ripple-binary-codec'
import {
  deriveAddress,
  deriveKeypair,
  generateSeed,
  verify,
} from 'ripple-keypairs'

import ECDSA from '../common/ecdsa'
import { ValidationError } from '../common/errors'
import { Transaction } from '../models/transactions'
import { signOffline } from '../transaction/sign'
import { SignOptions } from '../transaction/types'

const DEFAULT_ALGORITHM: ECDSA = ECDSA.ed25519
const DEFAULT_DERIVATION_PATH = "m/44'/144'/0'/0/0"

function hexFromBuffer(buffer: Buffer): string {
  return buffer.toString('hex').toUpperCase()
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
   * @param seed - (Optional) The seed used to derive the account keys.
   */
  public constructor(publicKey: string, privateKey: string, seed?: string) {
    this.publicKey = publicKey
    this.privateKey = privateKey
    this.classicAddress = deriveAddress(publicKey)
    this.seed = seed
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
   * @param algorithm - The digital signature algorithm to generate an address for.
   * @returns A Wallet derived from a seed.
   */
  public static fromSeed(
    seed: string,
    algorithm: ECDSA = DEFAULT_ALGORITHM,
  ): Wallet {
    return Wallet.deriveWallet(seed, algorithm)
  }

  /**
   * Derives a wallet from a secret (AKA a seed).
   *
   * @param secret - A string used to generate a keypair (publicKey/privateKey) to derive a wallet.
   * @param algorithm - The digital signature algorithm to generate an address fro.
   * @returns A Wallet derived from a secret (AKA a seed).
   */
  public static fromSecret = Wallet.fromSeed

  /**
   * Derives a wallet from a mnemonic.
   *
   * @param mnemonic - A string consisting of words (whitespace delimited) used to derive a wallet.
   * @param derivationPath - The path to derive a keypair (publicKey/privateKey) from a seed (that was converted from a mnemonic).
   * @returns A Wallet derived from a mnemonic.
   * @throws ValidationError if unable to derive private key from mnemonic input.
   */
  public static fromMnemonic(
    mnemonic: string,
    derivationPath: string = DEFAULT_DERIVATION_PATH,
  ): Wallet {
    const seed = mnemonicToSeedSync(mnemonic)
    const masterNode = fromSeed(seed)
    const node = masterNode.derivePath(derivationPath)
    if (node.privateKey === undefined) {
      throw new ValidationError(
        'Unable to derive privateKey from mnemonic input',
      )
    }

    const publicKey = hexFromBuffer(node.publicKey)
    const privateKey = hexFromBuffer(node.privateKey)
    return new Wallet(publicKey, `00${privateKey}`)
  }

  /**
   * Derives a wallet from an entropy (array of random numbers).
   *
   * @param entropy - An array of random numbers to generate a seed used to derive a wallet.
   * @param algorithm - The digital signature algorithm to generate an address for.
   * @returns A Wallet derived from an entropy.
   */
  public static fromEntropy(
    entropy: Uint8Array | number[],
    algorithm: ECDSA = DEFAULT_ALGORITHM,
  ): Wallet {
    const options = {
      entropy: Uint8Array.from(entropy),
      algorithm,
    }
    const seed = generateSeed(options)
    return Wallet.deriveWallet(seed, algorithm)
  }

  /**
   * Derive a Wallet from a seed.
   *
   * @param seed - The seed used to derive the wallet.
   * @param algorithm - The algorithm used to do the derivation.
   * @returns A Wallet derived from the seed.
   */
  private static deriveWallet(
    seed: string,
    algorithm: ECDSA = DEFAULT_ALGORITHM,
  ): Wallet {
    const { publicKey, privateKey } = deriveKeypair(seed, { algorithm })
    return new Wallet(publicKey, privateKey, seed)
  }

  /**
   * Signs a transaction offline.
   *
   * @param transaction - A transaction to be signed offline.
   * @param options - Options to include for signing.
   * @returns A signed transaction.
   */
  public signTransaction(
    transaction: Transaction,
    options: SignOptions = { signAs: '' },
  ): string {
    return signOffline(this, JSON.stringify(transaction), options)
      .signedTransaction
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
   * Gets the classic address of the account this wallet represents.
   *
   * @returns A classic address.
   */
  public getClassicAddress(): string {
    return deriveAddress(this.publicKey)
  }
}

export default Wallet
