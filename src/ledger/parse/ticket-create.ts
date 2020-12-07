import * as assert from 'assert'
import {removeUndefined} from '../../common'

function parseTicketCreate(tx: any): object {
  assert.ok(tx.TransactionType === 'TicketCreate')
  return removeUndefined({
    ticketCount: tx.TicketCount
  })
}

export default parseTicketCreate
