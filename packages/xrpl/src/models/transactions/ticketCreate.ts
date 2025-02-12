import { ValidationError } from '../../errors'

import {
  BaseTransaction,
  isNumber,
  validateBaseTransaction,
  validateRequiredField,
} from './common'

/**
 * A TicketCreate transaction sets aside one or more sequence numbers as
 * Tickets.
 *
 * @category Transaction Models
 */
export interface TicketCreate extends BaseTransaction {
  TransactionType: 'TicketCreate'
  /**
   * How many Tickets to create. This must be a positive number and cannot
   * cause the account to own more than 250 Tickets after executing this
   * transaction.
   */
  TicketCount: number
}

const MAX_TICKETS = 250

/**
 * Verify the form and type of a TicketCreate at runtime.
 *
 * @param tx - A TicketCreate Transaction.
 * @throws When the TicketCreate is malformed.
 */
export function validateTicketCreate(tx: Record<string, unknown>): void {
  validateBaseTransaction(tx)

  validateRequiredField(tx, 'TicketCount', isNumber)
  const ticketCount = Number(tx.TicketCount)
  if (
    !Number.isInteger(ticketCount) ||
    ticketCount < 1 ||
    ticketCount > MAX_TICKETS
  ) {
    throw new ValidationError(
      'TicketCreate: TicketCount must be an integer from 1 to 250',
    )
  }
}
