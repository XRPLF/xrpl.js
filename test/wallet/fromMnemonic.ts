import assert from 'assert-diff'
import {TestSuite} from '../testUtils'
import Wallet from '../../src/Wallet'

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
  'Wallet.fromMnemonic using default derivation path': async (api) => {
    // GIVEN no derivation path
    // WHEN deriving a wallet from a mnemonic without a derivation path
    const wallet = Wallet.fromMnemonic(mnemonic)

    // THEN we get a wallet with a keypair (publicKey/privateKey)
    assert.equal(wallet.publicKey, publicKey)
    assert.equal(wallet.privateKey, privateKey)
  },

  'Wallet.fromMnemonic using an input derivation path': async (api) => {
    // GIVEN a derivation path
    const derivationPath = "m/44'/144'/0'/0/0"

    // WHEN deriving a wallet from a mnemonic without a derivation path
    const wallet = Wallet.fromMnemonic(mnemonic, derivationPath)

    // THEN we get a wallet with a keypair (publicKey/privateKey)
    assert.equal(wallet.publicKey, publicKey)
    assert.equal(wallet.privateKey, privateKey)
  },
}
