import { ValidationError } from 'xrpl-local/common/errors'
import { verifyTicketCreate } from './../../src/models/transactions/ticketCreate'
import { assert } from 'chai'

/**
 * TicketCreate Transaction Verification Testing
 *
 * Providing runtime verification testing for each specific transaction type
 */
describe('TicketCreate Transaction Verification', () => {
    let ticketCreate

    beforeEach(() => {
        ticketCreate = {
            TransactionType: 'TicketCreate',
            Account: 'rUn84CUYbNjRoTQ6mSW7BVJPSVJNLb1QLo',
            TicketCount: 150,
        } as any
    })

    it ('verifies valid TicketCreate', () => {
        assert.doesNotThrow(() => verifyTicketCreate(ticketCreate))
    })

    it ('throws when TicketCount is missing', () => {
        delete ticketCreate.TicketCount
        assert.throws(
            () => verifyTicketCreate(ticketCreate),
            ValidationError,
            'TicketCreate: missing field TicketCount'
        )
    })

    it ('throws when TicketCount is not a number', () => {
        ticketCreate.TicketCount = '150'
        assert.throws(
            () => verifyTicketCreate(ticketCreate),
            ValidationError,
            'TicketCreate: TicketCount must be a number'
        )
    })

    it ('throws when TicketCount is not an integer', () => {
        ticketCreate.TicketCount = 12.5
        assert.throws(
            () => verifyTicketCreate(ticketCreate),
            ValidationError,
            'TicketCreate: TicketCount must be an integer from 1 to 250'
        )
    })

    it ('throws when TicketCount is < 1', () => {
        ticketCreate.TicketCount = 0
        assert.throws(
            () => verifyTicketCreate(ticketCreate),
            ValidationError,
            'TicketCreate: TicketCount must be an integer from 1 to 250'
        )
    })

    it ('throws when TicketCount is > 250', () => {
        ticketCreate.TicketCount = 251
        assert.throws(
            () => verifyTicketCreate(ticketCreate),
            ValidationError,
            'TicketCreate: TicketCount must be an integer from 1 to 250'
        )
    })
})
