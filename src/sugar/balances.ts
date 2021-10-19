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

interface GetXrpBalanceOptions {
  ledger_hash?: string
  ledger_index?: LedgerIndex
}

interface GetBalancesOptions {
  ledger_hash?: string
  ledger_index?: LedgerIndex
  peer?: string
  limit?: number
}

/**
 * Get the XRP balance for an account.
 *
 * @param this - Client.
 * @param account - Account address.
 * @param options - Options to include for getting the XRP balance.
 * @returns The XRP balance of the account (as a string).
 */
async function getXrpBalance(
  this: Client,
  account: string,
  options: GetXrpBalanceOptions = {},
): Promise<string> {
  const xrpRequest: AccountInfoRequest = {
    command: 'account_info',
    account,
    ledger_index: options.ledger_index ?? 'validated',
    ledger_hash: options.ledger_hash,
  }
  const response = await this.request(xrpRequest)
  return dropsToXrp(response.result.account_data.Balance)
}

/**
 * Get XRP/non-XRP balances for an account.
 *
 * @param this - Client.
 * @param account - Account address.
 * @param options - Allows the user to to look up balance in a ledger with given
 * ledger_index or ledger_hash, filter by peer, and limit number of balances.
 * @param options.ledger_index - Retrieve the account balances at a given
 * ledger_index.
 * @param options.ledger_hash - Retrieve the account balances at the ledger with
 * a given ledger_hash.
 * @param options.peer - Filter balances by peer.
 * @param options.limit - Limit number of balances to return.
 * @returns An array of XRP/non-XRP balances for the given account.
 */
async function getBalances(
  this: Client,
  account: string,
  options: GetBalancesOptions = {},
): Promise<Balance[]> {
  const balances: Balance[] = []

  // get XRP balance
  let xrpPromise: Promise<string> = Promise.resolve('')
  if (!options.peer) {
    xrpPromise = this.getXrpBalance(account, {
      ledger_hash: options.ledger_hash,
      ledger_index: options.ledger_index,
    })
  }

  // get non-XRP balances
  const linesRequest: AccountLinesRequest = {
    command: 'account_lines',
    account,
    ledger_index: options.ledger_index ?? 'validated',
    ledger_hash: options.ledger_hash,
    peer: options.peer,
    limit: options.limit,
  }
  const linesPromise = this.requestAll(linesRequest)

  // combine results
  await Promise.all([xrpPromise, linesPromise]).then(
    ([xrpBalance, linesResponses]) => {
      const accountLinesBalance = _.flatMap(linesResponses, (response) =>
        formatBalances(response.result.lines),
      )
      if (xrpBalance !== '') {
        balances.push({ currency: 'XRP', value: xrpBalance })
      }
      balances.push(...accountLinesBalance)
    },
  )
  return balances.slice(0, options.limit)
}

export { getXrpBalance, getBalances }
