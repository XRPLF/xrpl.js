/* eslint-disable no-param-reassign -- Necessary for test setup */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types -- Necessary for test setup */
import { Client, BroadcastClient } from 'xrpl-local'

import createMockRippled from './mockRippled'
import { getFreePort } from './testUtils'

async function setupMockRippledConnection(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Typing is too complicated
  testcase: any,
  port: number,
): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    testcase.mockRippled = createMockRippled(port)
    testcase._mockedServerPort = port
    testcase.client = new Client(`ws://localhost:${port}`)
    testcase.client.connect().then(resolve).catch(reject)
  })
}

async function setupMockRippledConnectionForBroadcast(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Typing is too complicated
  testcase: any,
  ports: number[],
): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const servers = ports.map((port) => `ws://localhost:${port}`)
    // eslint-disable-next-line max-len -- Too many rules to disable
    // eslint-disable-next-line @typescript-eslint/promise-function-async, @typescript-eslint/no-unsafe-return -- Typing is too complicated, not an async function
    testcase.mocks = ports.map((port) => createMockRippled(port))
    testcase.client = new BroadcastClient(servers)
    testcase.client.connect().then(resolve).catch(reject)
  })
}

async function setupClient(this: unknown): Promise<void> {
  return getFreePort().then(async (port) => {
    return setupMockRippledConnection(this, port)
  })
}

async function setupBroadcast(this: unknown): Promise<void> {
  return Promise.all([getFreePort(), getFreePort()]).then(async (ports) => {
    return setupMockRippledConnectionForBroadcast(this, ports)
  })
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Typing is too complicated
function teardownClient(this: any, done: () => void): void {
  this.client
    .disconnect()
    .then(() => {
      // eslint-disable-next-line no-negated-condition -- Easier to read with negation
      if (this.mockRippled != null) {
        this.mockRippled.close()
      } else {
        this.mocks.forEach((mock: { close: () => void }) => mock.close())
      }
      setImmediate(done)
    })
    .catch(done)
}

export { setupClient, teardownClient, setupBroadcast, createMockRippled }
