import { assert } from 'chai'

import { ValidationError } from 'xrpl-local/common/errors'

import { verify } from '../../src/models/transactions'
import { verifyTicketCreate } from '../../src/models/transactions/ticketCreate'

/**
 * TicketCreate Transaction Verification Testing.
 *
 * Providing runtime verification testing for each specific transaction type.
 */
describe('TicketCreate', function () {
  let ticketCreate

  beforeEach(function () {
    ticketCreate = {
      TransactionType: 'TicketCreate',
      Account: 'rUn84CUYbNjRoTQ6mSW7BVJPSVJNLb1QLo',
      TicketCount: 150,
    } as any
  })

  it('verifies valid TicketCreate', function () {
    assert.doesNotThrow(() => verifyTicketCreate(ticketCreate))
    assert.doesNotThrow(() => verify(ticketCreate))
  })

  it('throws when TicketCount is missing', function () {
    delete ticketCreate.TicketCount
    assert.throws(
      () => verifyTicketCreate(ticketCreate),
      ValidationError,
      'TicketCreate: missing field TicketCount',
    )
    assert.throws(
      () => verify(ticketCreate),
      ValidationError,
      'TicketCreate: missing field TicketCount',
    )
  })

  it('throws when TicketCount is not a number', function () {
    ticketCreate.TicketCount = '150'
    assert.throws(
      () => verifyTicketCreate(ticketCreate),
      ValidationError,
      'TicketCreate: TicketCount must be a number',
    )
    assert.throws(
      () => verify(ticketCreate),
      ValidationError,
      'TicketCreate: TicketCount must be a number',
    )
  })

  it('throws when TicketCount is not an integer', function () {
    ticketCreate.TicketCount = 12.5
    assert.throws(
      () => verifyTicketCreate(ticketCreate),
      ValidationError,
      'TicketCreate: TicketCount must be an integer from 1 to 250',
    )
    assert.throws(
      () => verify(ticketCreate),
      ValidationError,
      'TicketCreate: TicketCount must be an integer from 1 to 250',
    )
  })

  it('throws when TicketCount is < 1', function () {
    ticketCreate.TicketCount = 0
    assert.throws(
      () => verifyTicketCreate(ticketCreate),
      ValidationError,
      'TicketCreate: TicketCount must be an integer from 1 to 250',
    )
    assert.throws(
      () => verify(ticketCreate),
      ValidationError,
      'TicketCreate: TicketCount must be an integer from 1 to 250',
    )
  })

  it('throws when TicketCount is > 250', function () {
    ticketCreate.TicketCount = 251
    assert.throws(
      () => verifyTicketCreate(ticketCreate),
      ValidationError,
      'TicketCreate: TicketCount must be an integer from 1 to 250',
    )
    assert.throws(
      () => verify(ticketCreate),
      ValidationError,
      'TicketCreate: TicketCount must be an integer from 1 to 250',
    )
  })
})
