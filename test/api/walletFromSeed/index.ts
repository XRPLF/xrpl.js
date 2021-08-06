import assert from 'assert-diff'
import {TestSuite} from '../../utils'
import Wallet, {WalletOptions} from '../../../src/offline/wallet'

const seed = 'ssL9dv2W5RK8L3tuzQxYY6EaZhSxW'
const publicKey =
  '030E58CDD076E798C84755590AAF6237CA8FAE821070A59F648B517A30DC6F589D'
const privateKey =
  '00141BA006D3363D2FB2785E8DF4E44D3A49908780CB4FB51F6D217C08C021429F'

/**
 * Every test suite exports their tests in the default object.
 * - Check out the "TestSuite" type for documentation on the interface.
 * - Check out "test/api/index.ts" for more information about the test runner.
 */
export default <TestSuite>{
  'walletFromSeed with empty options object': async (api) => {
    // GIVEN an empty options object
    const options: WalletOptions = {}

    // WHEN deriving a wallet from a seed
    const wallet = Wallet.walletFromSeed(seed, options)

    // THEN we get a wallet with a keypair (publicKey/privateKey)
    assert.equal(wallet.publicKey, publicKey)
    assert.equal(wallet.privateKey, privateKey)
  },

  'walletFromSeed with algorithm ecdsa-secp256k1': async (api) => {
    // GIVEN we want to use ecdsa-secp256k1
    const options: WalletOptions = {algorithm: 'ecdsa-secp256k1'}

    // WHEN deriving a wallet from a seed
    const wallet = Wallet.walletFromSeed(seed, options)

    // THEN we get a wallet with a keypair (publicKey/privateKey)
    assert.equal(wallet.publicKey, publicKey)
    assert.equal(wallet.privateKey, privateKey)
  },

  'walletFromSeed with algorithm ed25519': async (api) => {
    // GIVEN we want to use ed25519
    const options: WalletOptions = {algorithm: 'ed25519'}

    // WHEN deriving a wallet from a seed
    const wallet = Wallet.walletFromSeed(seed, options)

    // THEN we get a wallet with a keypair (publicKey/privateKey)
    assert.equal(wallet.publicKey, publicKey)
    assert.equal(wallet.privateKey, privateKey)
  },
}
