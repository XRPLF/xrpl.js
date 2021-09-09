import _ from 'lodash'

import type { Client } from '..'
import { LedgerIndex } from '../models/common'
import { AccountInfoRequest } from '../models/methods'
import { AccountLinesRequest, Trustline } from '../models/methods/accountLines'
import { dropsToXrp } from '../utils'

interface Balance {
  value: string
  currency: string
  issuer?: string
}

function formatBalances(trustlines: Trustline[]): Balance[] {
  return trustlines.map((trustline) => ({
    value: trustline.balance,
    currency: trustline.currency,
    issuer: trustline.account,
  }))
}

interface GetBalancesOptions {
  ledger_hash?: string
  ledger_index?: LedgerIndex
  peer?: string
  limit?: number
}

/**
 * Get XRP/non-XRP balances for an account.
 *
 * @param client - Client.
 * @param account - Account address.
 * @param options - Options to include for getting balances.
 * @returns An array of XRP/non-XRP balances.
 */
async function getBalances(
  client: Client,
  account: string,
  options: GetBalancesOptions = {},
): Promise<Balance[]> {
  // 1. Get XRP Balance
  const xrpRequest: AccountInfoRequest = {
    command: 'account_info',
    account,
    ledger_index: options.ledger_index ?? 'validated',
    ledger_hash: options.ledger_hash,
  }
  const balance = await client
    .request(xrpRequest)
    .then((response) => response.result.account_data.Balance)
  const xrpBalance = { currency: 'XRP', value: dropsToXrp(balance) }
  // 2. Get Non-XRP Balance
  const linesRequest: AccountLinesRequest = {
    command: 'account_lines',
    account,
    ledger_index: options.ledger_index ?? 'validated',
    ledger_hash: options.ledger_hash,
    peer: options.peer,
    limit: options.limit,
  }
  const responses = await client.requestAll(linesRequest)
  const accountLinesBalance = _.flatMap(responses, (response) =>
    formatBalances(response.result.lines),
  )
  return [xrpBalance, ...accountLinesBalance]
}

export default getBalances
