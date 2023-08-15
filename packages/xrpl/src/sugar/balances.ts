import { AccountLinesTrustline, Balance } from '../models'

/**
 * Formats an array of trustlines into an array of balances.
 *
 * @param trustlines - The array of trustlines to format.
 * @returns An array of balances, each containing the value, currency, and issuer.
 */
export function formatBalances(trustlines: AccountLinesTrustline[]): Balance[] {
  return trustlines.map((trustline) => ({
    value: trustline.balance,
    currency: trustline.currency,
    issuer: trustline.account,
  }))
}
