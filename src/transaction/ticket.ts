import * as _ from 'lodash'
import * as utils from './utils'
import {Prepare, TransactionJSON, Instructions} from './types'
import {RippleAPI} from '..'

const validate = utils.common.validate
const ValidationError = utils.common.errors.ValidationError

export interface Ticket {
  account: string
  sequence: number
}

function createTicketTransaction(
  account: string,
  ticketCount: number
): TransactionJSON {
  if (!ticketCount || ticketCount === 0)
    throw new ValidationError('Ticket count must be greater than 0.')

  const txJSON: any = {
    TransactionType: 'TicketCreate',
    Account: account,
    TicketCount: ticketCount
  }

  return txJSON
}

function prepareTicket(
  this: RippleAPI,
  address: string,
  ticketCount: number,
  instructions: Instructions = {}
): Promise<Prepare> {
  try {
    validate.prepareTicket({address, ticketCount, instructions})
    const txJSON = createTicketTransaction(address, ticketCount)
    return utils.prepareTransaction(txJSON, this, instructions)
  } catch (e) {
    return Promise.reject(e)
  }
}

export default prepareTicket
