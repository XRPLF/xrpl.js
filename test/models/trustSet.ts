import { ValidationError } from 'xrpl-local/common/errors'
import { verifyTrustSet } from './../../src/models/transactions/trustSet'
import { assert } from 'chai'

/**
 * TrustSet Transaction Verification Testing
 *
 * Providing runtime verification testing for each specific transaction type
 */
describe('TrustSet Transaction Verification', () => {
    let trustSet

    beforeEach(() => {
        trustSet = {
            TransactionType: 'TrustSet',
            Account: 'rUn84CUYbNjRoTQ6mSW7BVJPSVJNLb1QLo',
            LimitAmount: {
                currency: 'XRP',
                issuer: 'rcXY84C4g14iFp6taFXjjQGVeHqSCh9RX',
                value: '4329.23'
            },
            QualityIn: 1234,
            QualityOut: 4321,
        } as any
    })

    it ('verifies valid TrustSet', () => {
        assert.doesNotThrow(() => verifyTrustSet(trustSet))
    })

    it ('throws when LimitAmount is missing', () => {
        delete trustSet.LimitAmount
        assert.throws(
            () => verifyTrustSet(trustSet),
            ValidationError,
            'TrustSet: missing field LimitAmount'
        )
    })

    it ('throws when LimitAmount is invalid', () => {
        trustSet.LimitAmount = 1234
        assert.throws(
            () => verifyTrustSet(trustSet),
            ValidationError,
            'TrustSet: invalid LimitAmount'
        )
    })

    it ('throws when QualityIn is not a number', () => {
        trustSet.QualityIn = '1234'
        assert.throws(
            () => verifyTrustSet(trustSet),
            ValidationError,
            'TrustSet: QualityIn must be a number'
        )
    })

    it ('throws when QualityOut is not a number', () => {
        trustSet.QualityOut = '4321'
        assert.throws(
            () => verifyTrustSet(trustSet),
            ValidationError,
            'TrustSet: QualityOut must be a number'
        )
    })
})
