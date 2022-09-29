import { Client, Wallet } from 'xrpl-local'

import serverUrl from './serverUrl'
import { fundAccount } from './utils'

export interface XrplIntegrationTestContext {
  client: Client
  wallet: Wallet
}

export async function teardownClient(
  context: XrplIntegrationTestContext,
): Promise<void> {
  context.client.removeAllListeners()
  context.client.disconnect()
}

export async function setupClient(
  server = serverUrl,
): Promise<XrplIntegrationTestContext> {
  const context: XrplIntegrationTestContext = {
    client: new Client(server),
    wallet: Wallet.generate(),
  }
  return context.client.connect().then(async () => {
    await fundAccount(context.client, context.wallet)
    return context
  })
}
