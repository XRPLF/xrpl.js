import { ValidationError } from 'xrpl-local/common/errors'
import { verifyDepositPreauth } from './../../src/models/transactions/depositPreauth'
import { assert } from 'chai'

/**
 * DepositPreauth Transaction Verification Testing
 *
 * Providing runtime verification testing for each specific transaction type
 */
describe('DepositPreauth Transaction Verification', () => {
    let depositPreauth

    beforeEach(() => {
        depositPreauth = {
            TransactionType: 'DepositPreauth',
            Account: 'rUn84CUYbNjRoTQ6mSW7BVJPSVJNLb1QLo',
        } as any
    })

    it ('verifies valid DepositPreauth when only Authorize is provided', () => {
        depositPreauth.Authorize = 'rsA2LpzuawewSBQXkiju3YQTMzW13pAAdW'
        assert.doesNotThrow(() => verifyDepositPreauth(depositPreauth))
    })

    it ('verifies valid DepositPreauth when only Unauthorize is provided', () => {
        depositPreauth.Unauthorize = 'raKEEVSGnKSD9Zyvxu4z6Pqpm4ABH8FS6n'
        assert.doesNotThrow(() => verifyDepositPreauth(depositPreauth))
    })

    it ('throws when both Authorize and Unauthorize are provided', () => {
        depositPreauth.Authorize = 'rsA2LpzuawewSBQXkiju3YQTMzW13pAAdW'
        depositPreauth.Unauthorize = 'raKEEVSGnKSD9Zyvxu4z6Pqpm4ABH8FS6n'
        assert.throws(
            () => verifyDepositPreauth(depositPreauth),
            ValidationError,
            "DepositPreauth: can't provide both Authorize and Unauthorize fields"
        )
    })

    it ('throws when neither Authorize nor Unauthorize are provided', () => {
        assert.throws(
            () => verifyDepositPreauth(depositPreauth),
            ValidationError,
            'DepositPreauth: must provide either Authorize or Unauthorize field'
        )
    })

    it ('throws when Authorize is not a string', () => {
        depositPreauth.Authorize = 1234
        assert.throws(
            () => verifyDepositPreauth(depositPreauth),
            ValidationError,
            'DepositPreauth: Authorize must be a string'
        )
    })

    it ('throws when an Account attempts to preauthorize its own address', () => {
        depositPreauth.Authorize = depositPreauth.Account
        assert.throws(
            () => verifyDepositPreauth(depositPreauth),
            ValidationError,
            "DepositPreauth: Account can't preauthorize its own address"
        )
    })

    it ('throws when Unauthorize is not a string', () => {
        depositPreauth.Unauthorize = 1234
        assert.throws(
            () => verifyDepositPreauth(depositPreauth),
            ValidationError,
            'DepositPreauth: Unauthorize must be a string'
        )
    })

    it ('throws when an Account attempts to unauthorize its own address', () => {
        depositPreauth.Unauthorize = depositPreauth.Account
        assert.throws(
            () => verifyDepositPreauth(depositPreauth),
            ValidationError,
            "DepositPreauth: Account can't unauthorize its own address"
        )
    })
})
