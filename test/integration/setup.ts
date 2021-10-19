import { Client, Wallet } from 'xrpl-local'

import serverUrl from './serverUrl'
import { fundAccount } from './utils'

export async function teardownClient(this: Mocha.Context): Promise<void> {
  this.client.removeAllListeners()
  this.client.disconnect()
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
