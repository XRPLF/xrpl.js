import { ValidationError } from '../../common/errors'
import { BaseTransaction, verifyBaseTransaction } from './common'

export interface TicketCreate extends BaseTransaction {
    TransactionType: 'TicketCreate'
    TicketCount: number
}

/**
 * 
 * @param {TicketCreate} tx A TicketCreate Transaction.
 * @returns {void}
 * @throws {ValidationError} When the TicketCreate is malformed.
 */
 export function verifyTicketCreate(tx: TicketCreate): void {
    verifyBaseTransaction(tx)

    if (tx.TicketCount === undefined) {
        throw new ValidationError('TicketCreate: missing field TicketCount')
    }

    if (typeof tx.TicketCount !== 'number' || tx.TicketCount < 1 || tx.TicketCount > 250) {
        throw new ValidationError('TicketCreate: TicketCount must be an integer from 1 to 250')
    }
}
