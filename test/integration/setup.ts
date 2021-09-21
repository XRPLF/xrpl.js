import { generateXAddress, Client, Wallet } from 'xrpl-local'

import serverUrl from './serverUrl'
import { fundAccount, ledgerAccept } from './utils'

export async function teardownClient(this: Mocha.Context): Promise<void> {
  this.client.disconnect()
}

export async function suiteClientSetup(this: Mocha.Context): Promise<void> {
  this.transactions = []

  await setupClient.bind(this)(serverUrl)
  await ledgerAccept(this.client)
  this.newWallet = generateXAddress({ includeClassicAddress: true })
  // two times to give time to server to send `ledgerClosed` event
  // so getLedgerVersion will return right value
  await ledgerAccept(this.client)
  const response = await this.client.request({
    command: 'ledger',
    ledger_index: 'validated',
  })
  const ledgerVersion = response.result.ledger_index
  this.startLedgerVersion = ledgerVersion
  await teardownClient.bind(this)()
}

export async function setupClient(
  this: Mocha.Context,
  server = serverUrl,
): Promise<void> {
  this.wallet = Wallet.generate()
  return new Promise<void>((resolve, reject) => {
    this.client = new Client(server)
    this.client
      .connect()
      .then(async () => {
        await fundAccount(this.client, this.wallet)
        resolve()
      })
      .catch(reject)
  })
}
