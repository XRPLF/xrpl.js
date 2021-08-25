import assert from 'assert-diff'
import {TestSuite} from '../testUtils'
import ECDSA from '../../src/common/ecdsa'
import Wallet from '../../src/Wallet'

const entropy: number[] = new Array(16).fill(0)
const publicKey: string =
  '0390A196799EE412284A5D80BF78C3E84CBB80E1437A0AECD9ADF94D7FEAAFA284'
const privateKey: string =
  '002512BBDFDBB77510883B7DCCBEF270B86DEAC8B64AC762873D75A1BEE6298665'
const publicKeyED25519: string =
  'ED1A7C082846CFF58FF9A892BA4BA2593151CCF1DBA59F37714CC9ED39824AF85F'
const privateKeyED25519: string =
  'ED0B6CBAC838DFE7F47EA1BD0DF00EC282FDF45510C92161072CCFB84035390C4D'

/**
 * Every test suite exports their tests in the default object.
 * - Check out the "TestSuite" type for documentation on the interface.
 * - Check out "test/api/index.ts" for more information about the test runner.
 */
export default <TestSuite>{
  'Wallet.fromEntropy with entropy only': async (api) => {
    // WHEN deriving a wallet from an entropy
    const wallet = Wallet.fromEntropy(entropy)

    // THEN we get a wallet with a keypair (publicKey/privateKey)
    assert.equal(wallet.publicKey, publicKeyED25519)
    assert.equal(wallet.privateKey, privateKeyED25519)
  },

  'Wallet.fromEntropy with algorithm ecdsa-secp256k1': async (api) => {
    // GIVEN an entropy using ecdsa-secp256k1
    const algorithm = ECDSA.secp256k1

    // WHEN deriving a wallet from an entropy
    const wallet = Wallet.fromEntropy(entropy, algorithm)

    // THEN we get a wallet with a keypair (publicKey/privateKey)
    assert.equal(wallet.publicKey, publicKey)
    assert.equal(wallet.privateKey, privateKey)
  },

  'Wallet.fromEntropy with algorithm ed25519': async (api) => {
    // GIVEN an entropy using ed25519
    const algorithm = ECDSA.ed25519

    // WHEN deriving a wallet from an entropy
    const wallet = Wallet.fromEntropy(entropy, algorithm)

    // THEN we get a wallet with a keypair (publicKey/privateKey)
    assert.equal(wallet.publicKey, publicKeyED25519)
    assert.equal(wallet.privateKey, privateKeyED25519)
  },
}
