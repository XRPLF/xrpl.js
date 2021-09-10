import { generateXAddress, Client } from 'xrpl-local'

import serverUrl from './serverUrl'
import { ledgerAccept, setupAccounts } from './utils'

export async function teardownClient(this: Mocha.Context): Promise<void> {
  await this.client.disconnect()
}

export async function suiteClientSetup(this: any) {
  this.transactions = []

  setupClient.bind(this)(serverUrl)
  ledgerAccept(this.client)
  this.newWallet = generateXAddress({ includeClassicAddress: true })
  // two times to give time to server to send `ledgerClosed` event
  // so getLedgerVersion will return right value
  ledgerAccept(this.client)
  const response = await this.client.request({
    command: 'ledger',
    ledger_index: 'validated',
  })
  const ledgerVersion = response.result.ledger_index
  this.startLedgerVersion = ledgerVersion
  await setupAccounts(this)
  teardownClient.bind(this)()
}

export async function setupClient(
  this: Mocha.Context,
  server = serverUrl,
): Promise<void> {
  this.client = new Client(server)
  console.log('CONNECTING...')
  this.client
    .connect()
    .then(() => {
      console.log('CONNECTED...')
    })
    .catch((error) => {
      console.log('ERROR:', error)
      throw error
    })

  return new Promise<void>((resolve, reject) => {
    this.client = new Client(server)
    console.log('CONNECTING...')
    this.client
      .connect()
      .then(() => {
        console.log('CONNECTED...')
        resolve()
      })
      .catch((error) => {
        console.log('ERROR:', error)
        reject()
      })
  })
}
