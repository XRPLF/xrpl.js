import flatMap from 'lodash/flatMap'

import type { Balance, Client } from '..'
import {
  AccountLinesRequest,
  AccountLinesTrustline,
  LedgerIndex,
  AccountInfoRequest,
} from '../models'
import { dropsToXrp } from '../utils'

function formatBalances(trustlines: AccountLinesTrustline[]): Balance[] {
  return trustlines.map((trustline) => ({
    value: trustline.balance,
    currency: trustline.currency,
    issuer: trustline.account,
  }))
}

/**
 * Get the XRP balance for an account.
 *
 * @example
 * ```ts
 * const client = new Client(wss://s.altnet.rippletest.net:51233)
 * const balance = await client.getXrpBalance('rG1QQv2nh2gr7RCZ1P8YYcBUKCCN633jCn')
 * console.log(balance)
 * /// '200'
 * ```
 *
 * @param this - Client.
 * @param address - Address of the account to retrieve XRP balance.
 * @param options - Options to include for getting the XRP balance.
 * @param options.ledger_index - Retrieve the account balances at a given
 * ledger_index.
 * @param options.ledger_hash - Retrieve the account balances at the ledger with
 * a given ledger_hash.
 * @returns The XRP balance of the account (as a string).
 */
async function getXrpBalance(
  this: Client,
  address: string,
  options: {
    ledger_hash?: string
    ledger_index?: LedgerIndex
  } = {},
): Promise<string> {
  const xrpRequest: AccountInfoRequest = {
    command: 'account_info',
    account: address,
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
 * @param address - Address of the account to retrieve balances for.
 * @param options - Allows the client to specify a ledger_hash, ledger_index,
 * filter by peer, and/or limit number of balances.
 * @param options.ledger_index - Retrieve the account balances at a given
 * ledger_index.
 * @param options.ledger_hash - Retrieve the account balances at the ledger with
 * a given ledger_hash.
 * @param options.peer - Filter balances by peer.
 * @param options.limit - Limit number of balances to return.
 * @returns An array of XRP/non-XRP balances for the given account.
 */
// eslint-disable-next-line max-lines-per-function -- Longer definition is required for end users to see the definition.
async function getBalances(
  this: Client,
  address: string,
  options: {
    ledger_hash?: string
    ledger_index?: LedgerIndex
    peer?: string
    limit?: number
  } = {},
): Promise<
  Array<{ value: string; currency: string; issuer?: string | undefined }>
> {
  const balances: Balance[] = []

  // get XRP balance
  let xrpPromise: Promise<string> = Promise.resolve('')
  if (!options.peer) {
    xrpPromise = this.getXrpBalance(address, {
      ledger_hash: options.ledger_hash,
      ledger_index: options.ledger_index,
    })
  }

  // get non-XRP balances
  const linesRequest: AccountLinesRequest = {
    command: 'account_lines',
    account: address,
    ledger_index: options.ledger_index ?? 'validated',
    ledger_hash: options.ledger_hash,
    peer: options.peer,
    limit: options.limit,
  }
  const linesPromise = this.requestAll(linesRequest)

  // combine results
  await Promise.all([xrpPromise, linesPromise]).then(
    ([xrpBalance, linesResponses]) => {
      const accountLinesBalance = flatMap(linesResponses, (response) =>
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
