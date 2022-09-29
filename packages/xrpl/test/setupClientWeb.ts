import { Client, BroadcastClient } from 'xrpl-local'

import { PortResponse } from './createMockRippled'

const defaultPort = 34371
const baseUrl = 'ws://testripple.circleci.com:'

export interface XrplClientWebTestContext {
  client: Client | BroadcastClient
}

async function setupClient(
  port = defaultPort,
): Promise<XrplClientWebTestContext> {
  const tclient = new Client(`${baseUrl}${port}`)
  return tclient
    .connect()
    .then(async () => {
      return tclient.connection.request({
        command: 'test_command',
        data: { openOnOtherPort: true },
      })
    })
    .then(async (got: unknown) => {
      const context: XrplClientWebTestContext = {
        client: new Client(`${baseUrl}${(got as PortResponse).result.port}`),
      }
      return context.client.connect().then(() => context)
    })
    .then(async (context: XrplClientWebTestContext) => {
      await tclient.disconnect()
      return context
    })
}

async function setupBroadcast(): Promise<XrplClientWebTestContext> {
  const servers = [defaultPort, defaultPort + 1].map(
    (port) => `${baseUrl}${port}`,
  )

  const context: XrplClientWebTestContext = {
    client: new BroadcastClient(servers),
  }

  return context.client.connect().then(() => context)
}

async function teardownClient(
  context: XrplClientWebTestContext,
): Promise<void> {
  if (context.client.isConnected()) {
    return context.client.disconnect()
  }

  return Promise.resolve()
}

export { setupClient as setup, teardownClient as teardown, setupBroadcast }
