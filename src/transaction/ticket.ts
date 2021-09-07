import _ from 'lodash'

import type { Client } from '..'

import { Prepare, TransactionJSON, Instructions } from './types'
import * as utils from './utils'

const ValidationError = utils.common.errors.ValidationError

export interface Ticket {
  account: string
  sequence: number
}

function createTicketTransaction(
  account: string,
  ticketCount: number,
): TransactionJSON {
  if (!ticketCount || ticketCount === 0) {
    throw new ValidationError('Ticket count must be greater than 0.')
  }

  const txJSON: any = {
    TransactionType: 'TicketCreate',
    Account: account,
    TicketCount: ticketCount,
  }

  return txJSON
}

async function prepareTicketCreate(
  this: Client,
  address: string,
  ticketCount: number,
  instructions: Instructions = {},
): Promise<Prepare> {
  try {
    const txJSON = createTicketTransaction(address, ticketCount)
    return await utils.prepareTransaction(txJSON, this, instructions)
  } catch (e) {
    return Promise.reject(e)
  }
}

export default prepareTicketCreate
