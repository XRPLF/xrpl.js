import { assert } from 'chai'

import { validateTicketCreate, validate } from 'xrpl-local'
import { ValidationError } from 'xrpl-local/common/errors'

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
    assert.doesNotThrow(() => validateTicketCreate(ticketCreate))
    assert.doesNotThrow(() => validate(ticketCreate))
  })

  it('throws when TicketCount is missing', function () {
    delete ticketCreate.TicketCount
    assert.throws(
      () => validateTicketCreate(ticketCreate),
      ValidationError,
      'TicketCreate: missing field TicketCount',
    )
    assert.throws(
      () => validate(ticketCreate),
      ValidationError,
      'TicketCreate: missing field TicketCount',
    )
  })

  it('throws when TicketCount is not a number', function () {
    ticketCreate.TicketCount = '150'
    assert.throws(
      () => validateTicketCreate(ticketCreate),
      ValidationError,
      'TicketCreate: TicketCount must be a number',
    )
    assert.throws(
      () => validate(ticketCreate),
      ValidationError,
      'TicketCreate: TicketCount must be a number',
    )
  })

  it('throws when TicketCount is not an integer', function () {
    ticketCreate.TicketCount = 12.5
    assert.throws(
      () => validateTicketCreate(ticketCreate),
      ValidationError,
      'TicketCreate: TicketCount must be an integer from 1 to 250',
    )
    assert.throws(
      () => validate(ticketCreate),
      ValidationError,
      'TicketCreate: TicketCount must be an integer from 1 to 250',
    )
  })

  it('throws when TicketCount is < 1', function () {
    ticketCreate.TicketCount = 0
    assert.throws(
      () => validateTicketCreate(ticketCreate),
      ValidationError,
      'TicketCreate: TicketCount must be an integer from 1 to 250',
    )
    assert.throws(
      () => validate(ticketCreate),
      ValidationError,
      'TicketCreate: TicketCount must be an integer from 1 to 250',
    )
  })

  it('throws when TicketCount is > 250', function () {
    ticketCreate.TicketCount = 251
    assert.throws(
      () => validateTicketCreate(ticketCreate),
      ValidationError,
      'TicketCreate: TicketCount must be an integer from 1 to 250',
    )
    assert.throws(
      () => validate(ticketCreate),
      ValidationError,
      'TicketCreate: TicketCount must be an integer from 1 to 250',
    )
  })
})
