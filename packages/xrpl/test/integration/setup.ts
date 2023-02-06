import { Client, Wallet } from '../../src'

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
  return context.client.disconnect()
}

async function connectWithRetry(client: Client, tries = 0): Promise<void> {
  return client.connect().catch(async (error) => {
    if (tries < 10) {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve(connectWithRetry(client, tries + 1))
        }, 1000)
      })
    }

    throw error
  })
}

export async function setupClient(
  server = serverUrl,
): Promise<XrplIntegrationTestContext> {
  const context: XrplIntegrationTestContext = {
    client: new Client(server, { timeout: 200000 }),
    wallet: Wallet.generate(),
  }
  return connectWithRetry(context.client).then(async () => {
    await fundAccount(context.client, context.wallet, {
      count: 20,
      delayMs: 1000,
    })
    return context
  })
}
