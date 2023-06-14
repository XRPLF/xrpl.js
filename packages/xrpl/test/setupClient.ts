import { Client } from '../src/client'
// eslint-disable-next-line import/no-deprecated -- Will remove in 3.0.0
import BroadcastClient from '../src/client/BroadcastClient'

import createMockRippled, {
  type MockedWebSocketServer,
} from './createMockRippled'
import rippled from './fixtures/rippled'
import { destroyServer, getFreePort } from './testUtils'

export interface XrplTestContext {
  // eslint-disable-next-line import/no-deprecated -- Will remove in 3.0.0
  client: Client | BroadcastClient
  _mockedServerPort?: number
  mockRippled?: MockedWebSocketServer
  mocks?: MockedWebSocketServer[]
  servers?: number[]
}

async function setupMockRippledConnection(
  port: number,
): Promise<XrplTestContext> {
  const context: XrplTestContext = {
    mockRippled: createMockRippled(port),
    _mockedServerPort: port,
    client: new Client(`ws://localhost:${port}`),
    servers: [port],
  }

  context.client.on('error', () => {
    // We must have an error listener attached for reconnect errors
  })
  context.mockRippled?.addResponse(
    'server_info',
    rippled.server_info.withNetworkId,
  )

  return context.client.connect().then(() => context)
}

async function setupMockRippledConnectionForBroadcast(
  ports: number[],
): Promise<XrplTestContext> {
  const servers = ports.map((port) => `ws://localhost:${port}`)
  const context: XrplTestContext = {
    mocks: ports.map((port) => createMockRippled(port)),
    // eslint-disable-next-line import/no-deprecated -- Will remove in 3.0.0
    client: new BroadcastClient(servers),
    servers: ports,
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
    .then(async () => {
      return new Promise<void>((resolve) => {
        // eslint-disable-next-line no-negated-condition -- Easier to read with negation
        if (incomingContext.mockRippled != null) {
          incomingContext.mockRippled.close(() => {
            resolve()
          })
        } else {
          resolve()
        }
      })
    })
    .then(async () => {
      await Promise.all(
        incomingContext.servers?.map(async (port) => destroyServer(port)) ?? [],
      )
    })
    .catch((err) => {
      // eslint-disable-next-line no-console -- console.error is fine in tests
      console.error(err)
      if (done) {
        done()
      } else {
        throw err
      }
    })
}

export { setupClient, teardownClient, setupBroadcast, createMockRippled }
