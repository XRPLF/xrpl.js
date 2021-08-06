import assert from 'assert-diff'
import {TestSuite} from '../../utils'
import Wallet, {WalletOptions} from '../../../src/offline/wallet'

const mnemonic =
  'try milk link drift aware pass obtain again music stick pluck fold'
const publicKey =
  '0257B550BA2FDCCF0ADDA3DEB2A5411700F3ADFDCC7C68E1DCD1E2B63E6B0C63E6'
const privateKey =
  '008F942B6E229C0E9CEE47E7A94253DABB6A9855F4BA2D8A741FA31851A1D423C3'

/**
 * Every test suite exports their tests in the default object.
 * - Check out the "TestSuite" type for documentation on the interface.
 * - Check out "test/api/index.ts" for more information about the test runner.
 */
export default <TestSuite>{
  'walletFromMnemonic with empty options object': async (api) => {
    // GIVEN an empty options object
    const options: WalletOptions = {}

    // WHEN deriving a wallet from a mnemonic
    const wallet = Wallet.walletFromMnemonic(mnemonic, options)

    // THEN we get a wallet with a keypair (publicKey/privateKey)
    assert.equal(wallet.publicKey, publicKey)
    assert.equal(wallet.privateKey, privateKey)
  },

  'walletFromMnemonic with algorithm ecdsa-secp256k1': async (api) => {
    // GIVEN we want to use ecdsa-secp256k1
    const options: WalletOptions = {algorithm: 'ecdsa-secp256k1'}

    // WHEN deriving a wallet from a mnemonic
    const wallet = Wallet.walletFromMnemonic(mnemonic, options)

    // THEN we get a wallet with a keypair (publicKey/privateKey)
    assert.equal(wallet.publicKey, publicKey)
    assert.equal(wallet.privateKey, privateKey)
  },

  'walletFromMnemonic with algorithm ed25519': async (api) => {
    // GIVEN we want to use ed25519
    const options: WalletOptions = {algorithm: 'ed25519'}

    // WHEN deriving a wallet from a mnemonic
    const wallet = Wallet.walletFromMnemonic(mnemonic, options)

    // THEN we get a wallet with a keypair (publicKey/privateKey)
    assert.equal(wallet.publicKey, publicKey)
    assert.equal(wallet.privateKey, privateKey)
  },
}
