import { Client, BroadcastClient } from 'xrpl-local'

import createMockRippled, {
  type MockedWebSocketServer,
} from './createMockRippled'
import { getFreePort } from './testUtils'

export interface XrplTestContext {
  client: Client | BroadcastClient
  _mockedServerPort?: number
  mockRippled?: MockedWebSocketServer
  mocks?: MockedWebSocketServer[]
}

async function setupMockRippledConnection(
  port: number,
): Promise<XrplTestContext> {
  const context: XrplTestContext = {
    mockRippled: createMockRippled(port),
    _mockedServerPort: port,
    client: new Client(`ws://localhost:${port}`),
  }

  return context.client.connect().then(() => context)
}

async function setupMockRippledConnectionForBroadcast(
  ports: number[],
): Promise<XrplTestContext> {
  const servers = ports.map((port) => `ws://localhost:${port}`)
  const context: XrplTestContext = {
    mocks: ports.map((port) => createMockRippled(port)),
    client: new BroadcastClient(servers),
  }

  return context.client.connect().then(() => context)
}

async function setupClient(): Promise<XrplTestContext> {
  return getFreePort().then(async (port) => {
    return setupMockRippledConnection(port)
  })
}

async function setupBroadcast(): Promise<XrplTestContext> {
  return Promise.all([getFreePort(), getFreePort()]).then(async (ports) => {
    return setupMockRippledConnectionForBroadcast(ports)
  })
}

async function teardownClient(
  incomingContext: XrplTestContext,
  done?: () => void,
): Promise<void> {
  return incomingContext.client
    .disconnect()
    .then(() => {
      // eslint-disable-next-line no-negated-condition -- Easier to read with negation
      if (incomingContext.mockRippled != null) {
        incomingContext.mockRippled.close()
      } else {
        incomingContext.mocks?.forEach((mock: { close: () => void }) =>
          mock.close(),
        )
      }
      if (done) {
        setImmediate(done)
      }
    })
    .catch(done)
}

export { setupClient, teardownClient, setupBroadcast, createMockRippled }
