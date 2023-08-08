import { Client } from '../../dist/npm/client'
import { LedgerEntryRequest } from '../../dist/npm/models'

async function main(): Promise<void> {
  const client = new Client('wss://s.devnet.rippletest.net:51233/')
  await client.connect()

  const request: LedgerEntryRequest = {
    command: 'ledger_entry',
    index: '7DB0788C020F02780A673DC74757F23823FA3014C1866E72CC4CD8B226CD6EF4',
    ledger_index: 'validated',
  }
  const response = await client.request(request)
  console.log(response)
  // eslint-disable-next-line max-len -- Necessary for other linting rule removals.
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/consistent-type-assertions, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any -- This is a special ledger entry.
  const amendments = (response.result as any).node.Amendments

  console.log(amendments)

  await client.disconnect()
}

main().catch((error) => console.log(error))
