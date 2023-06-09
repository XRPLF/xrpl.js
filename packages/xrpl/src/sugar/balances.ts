import type { Trustline } from '../models/methods/accountLines'

export interface Balance {
  value: string
  currency: string
  issuer?: string
}

/**
 * Formats an array of trustlines into an array of balances.
 *
 * @param trustlines - The array of trustlines to format.
 * @returns An array of balances, each containing the value, currency, and issuer.
 */
export function formatBalances(trustlines: Trustline[]): Balance[] {
  return trustlines.map((trustline) => ({
    value: trustline.balance,
    currency: trustline.currency,
    issuer: trustline.account,
  }))
}
