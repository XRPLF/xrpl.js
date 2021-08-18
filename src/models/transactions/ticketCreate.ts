import { BaseTransaction } from './common'

export interface TicketCreate extends BaseTransaction {
    TransactionType: 'TicketCreate'
    TicketCount: number
}
