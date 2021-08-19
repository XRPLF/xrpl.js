import { ValidationError } from 'xrpl-local/common/errors'
import { verify } from './../../src/models/transactions/verify'
import { assert } from 'chai'

/**
 * Transaction Verification Testing
 *
 * Providing runtime verification testing for each specific transaction type
 */
describe('Global Transaction Verification', () => {
    let tx

    beforeEach(() => {
        tx = {
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
        assert.doesNotThrow(() => verify(tx))
    })

    it ('throws when LimitAmount is missing', () => {
        delete tx.LimitAmount
        assert.throws(
            () => verify(tx),
            ValidationError,
            'TrustSet: missing field LimitAmount'
        )
    })

    it ('throws when LimitAmount is invalid', () => {
        tx.LimitAmount = 1234
        assert.throws(
            () => verify(tx),
            ValidationError,
            'TrustSet: invalid LimitAmount'
        )
    })
})