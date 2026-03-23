import { validateTicketCreate } from '../../src/models/transactions/ticketCreate'
import { assertTxIsValid, assertTxValidationError } from '../testUtils'

const assertValid = (tx: any): void => assertTxIsValid(tx, validateTicketCreate)
const assertInvalid = (tx: any, message: string): void =>
  assertTxValidationError(tx, validateTicketCreate, message)

/**
 * TicketCreate Transaction Verification Testing.
 *
 * Providing runtime verification testing for each specific transaction type.
 */
describe('TicketCreate', function () {
  let ticketCreate: any

  beforeEach(function () {
    ticketCreate = {
      TransactionType: 'TicketCreate',
      Account: 'rUn84CUYbNjRoTQ6mSW7BVJPSVJNLb1QLo',
      TicketCount: 150,
    }
  })

  it('verifies valid TicketCreate', function () {
    assertValid(ticketCreate)
  })

  it('throws when TicketCount is missing', function () {
    delete ticketCreate.TicketCount
    assertInvalid(ticketCreate, 'TicketCreate: missing field TicketCount')
  })

  it('throws when TicketCount is not a number', function () {
    ticketCreate.TicketCount = '150'
    assertInvalid(ticketCreate, 'TicketCreate: TicketCount must be a number')
  })

  it('throws when TicketCount is not an integer', function () {
    ticketCreate.TicketCount = 12.5
    assertInvalid(
      ticketCreate,
      'TicketCreate: TicketCount must be an integer from 1 to 250',
    )
  })

  it('throws when TicketCount is < 1', function () {
    ticketCreate.TicketCount = 0
    assertInvalid(
      ticketCreate,
      'TicketCreate: TicketCount must be an integer from 1 to 250',
    )
  })

  it('throws when TicketCount is > 250', function () {
    ticketCreate.TicketCount = 251
    assertInvalid(
      ticketCreate,
      'TicketCreate: TicketCount must be an integer from 1 to 250',
    )
  })
})
