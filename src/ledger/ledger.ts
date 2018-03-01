import {validate} from '../common'
import parseLedger from './parse/ledger'
import {GetLedger} from './types'

export type LedgerOptions = {
  ledgerVersion?: number,
  includeAllData?: boolean,
  includeTransactions?: boolean,
  includeState?: boolean
}


function getLedger(options: LedgerOptions = {}): Promise<GetLedger> {
  validate.getLedger({options})

  const request = {
    command: 'ledger',
    ledger_index: options.ledgerVersion || 'validated',
    expand: options.includeAllData,
    transactions: options.includeTransactions,
    accounts: options.includeState
  }

  return this.connection.request(request).then(response =>
    parseLedger(response.ledger))
}

export default getLedger
