import * as utils from './utils'
import {validate} from '../common'
import {ISOTimeToRippleTime, toRippledAmount} from '../utils'
import {Instructions, Prepare, TransactionJSON} from './types'
import {Amount} from '../common/types/objects'
import {Client} from '..'

export type CheckCreateParameters = {
  destination: string
  sendMax: Amount
  destinationTag?: number
  expiration?: string
  invoiceID?: string
}

function createCheckCreateTransaction(
  account: string,
  check: CheckCreateParameters
): TransactionJSON {
  const txJSON: any = {
    Account: account,
    TransactionType: 'CheckCreate',
    Destination: check.destination,
    SendMax: toRippledAmount(check.sendMax)
  }

  if (check.destinationTag != null) {
    txJSON.DestinationTag = check.destinationTag
  }

  if (check.expiration != null) {
    txJSON.Expiration = ISOTimeToRippleTime(check.expiration)
  }

  if (check.invoiceID != null) {
    txJSON.InvoiceID = check.invoiceID
  }

  return txJSON
}

function prepareCheckCreate(
  this: Client,
  address: string,
  checkCreate: CheckCreateParameters,
  instructions: Instructions = {}
): Promise<Prepare> {
  try {
    validate.prepareCheckCreate({address, checkCreate, instructions})
    const txJSON = createCheckCreateTransaction(address, checkCreate)
    return utils.prepareTransaction(txJSON, this, instructions)
  } catch (e) {
    return Promise.reject(e)
  }
}

export default prepareCheckCreate
