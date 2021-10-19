import type { Client } from '..'

/**
 * Returns the index of the most recently validated ledger.
 *
 * @param this - The Client used to connect to the ledger.
 * @returns The most recently validated ledger index.
 */
export default async function getLedgerIndex(this: Client): Promise<number> {
  const ledgerResponse = await this.request({
    command: 'ledger',
    ledger_index: 'validated',
  })
  return ledgerResponse.result.ledger_index
}
