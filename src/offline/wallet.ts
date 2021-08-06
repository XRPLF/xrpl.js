import {fromSeed} from 'bip32'
import {mnemonicToSeedSync} from 'bip39'
import {decode, encodeForSigning} from 'ripple-binary-codec'
import {deriveKeypair, generateSeed, verify} from 'ripple-keypairs'
import {signOffline} from '../transaction/sign'
import {SignOptions} from '../transaction/types'

export interface WalletOptions {
  // The entropy to use to generate the seed.
  entropy?: Uint8Array | number[]

  // The digital signature algorithm to generate an address for. Can be `ecdsa-secp256k1` (default) or `ed25519`.
  algorithm?: 'ecdsa-secp256k1' | 'ed25519'

  // The path to derive a keypair (publicKey/privateKey) from a seed (that was converted from a mnemonic)
  derivationPath?: string
}

/**
 * A utility for deriving a wallet composed of a keypair (publicKey/privateKey).
 * A wallet can be derived from either a seed, mnemnoic, or entropy (random number).
 * It provides functionality to sign/verify transactions offline.
 */
class Wallet {
  readonly publicKey: string
  readonly privateKey: string
  private static readonly defaultAlgorithm: 'ecdsa-secp256k1' | 'ed25519' =
    'ed25519'
  private static readonly defaultDerivationPath: string = "m/44'/144'/0'/0/0"

  constructor(publicKey: string, privateKey: string) {
    this.publicKey = publicKey
    this.privateKey = privateKey
  }

  static walletFromSeed(seed: string, options: WalletOptions): Wallet {
    return Wallet.deriveWallet(seed, options)
  }

  static walletFromMnemonic(mnemonic: string, options: WalletOptions): Wallet {
    const seed = mnemonicToSeedSync(mnemonic)
    const masterNode = fromSeed(seed)
    const node = masterNode.derivePath(
      options.derivationPath ?? Wallet.defaultDerivationPath
    )
    if (node.privateKey === undefined) {
      return undefined
    }

    const publicKey = Wallet.hexFromBuffer(node.publicKey)
    const privateKey = Wallet.hexFromBuffer(node.privateKey)
    return new Wallet(publicKey, `00${privateKey}`)
  }

  static walletFromEntropy(options: WalletOptions): Wallet {
    const seed = generateSeed({
      entropy: Uint8Array.from(options.entropy),
      algorithm: options.algorithm
    })
    return Wallet.deriveWallet(seed, options)
  }

  private static hexFromBuffer(buffer: Buffer): string {
    return buffer.toString('hex').toUpperCase()
  }

  private static deriveWallet(seed: string, options: WalletOptions): Wallet {
    options.algorithm = options.algorithm ?? Wallet.defaultAlgorithm
    const {publicKey, privateKey} = deriveKeypair(seed, options)
    return new Wallet(publicKey, privateKey)
  }

  sign(
    txJSON: any,
    options: SignOptions = {signAs: ''}
  ): {signedTransaction: string; id: string} {
    return signOffline(this, JSON.stringify(txJSON), options)
  }

  verify(signedTransaction: {signedTransaction: string; id: string}): boolean {
    const txJSON = decode(signedTransaction.signedTransaction)
    const messageHex: string = encodeForSigning(txJSON)
    const signature = txJSON.TxnSignature
    return verify(messageHex, signature, this.publicKey)
  }
}

export default Wallet
