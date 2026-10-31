import { assert } from 'chai'
import { decode } from 'ripple-binary-codec'

import { Payment, verifySignature } from '../../src'
import ECDSA from '../../src/ECDSA'
import { Wallet } from '../../src/Wallet'
import vector from '../fixtures/rippled/dilithiumPayment.json'

// The vector is a standalone xrpld (rippled xrplf/quantum) wallet_propose with
// key_type dilithium and a sign of one Payment with that seed, which the node
// then applied with tesSUCCESS.
describe('Wallet with a Dilithium key', function () {
  const payment: Payment = { ...vector.transaction, TransactionType: 'Payment' }

  it('fromSeed derives the key and address wallet_propose returns', function () {
    const wallet = Wallet.fromSeed(vector.seed, { algorithm: ECDSA.dilithium })
    assert.equal(wallet.publicKey, vector.publicKey)
    assert.equal(wallet.classicAddress, vector.address)
  })

  it('verifySignature accepts the transaction xrpld signed', function () {
    assert.isTrue(verifySignature(vector.signedBlob))
  })

  it('sign makes a transaction that verifies and carries the Dilithium key', function () {
    const wallet = Wallet.fromSeed(vector.seed, { algorithm: ECDSA.dilithium })
    const signed = wallet.sign(payment)
    const decoded = decode(signed.tx_blob)
    assert.equal(decoded.SigningPubKey, vector.publicKey)
    assert.isTrue(verifySignature(signed.tx_blob))
    assert.isTrue(wallet.verifyTransaction(signed.tx_blob))
  })

  it('generate makes a family seed that derives the same Dilithium key', function () {
    const wallet = Wallet.generate(ECDSA.dilithium)
    assert.isDefined(wallet.seed)
    const seed = wallet.seed ?? ''
    assert.isTrue(seed.startsWith('s') && !seed.startsWith('sEd'))
    const again = Wallet.fromSeed(seed, { algorithm: ECDSA.dilithium })
    assert.equal(again.publicKey, wallet.publicKey)
    assert.lengthOf(wallet.publicKey, 1312 * 2)
  })
})
