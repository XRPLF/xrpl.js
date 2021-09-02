/* eslint-disable @typescript-eslint/explicit-module-boundary-types -- Necessary for testcase setup */
/* eslint-disable no-param-reassign -- Necessary for testcase setup */
import { Client, BroadcastClient } from 'xrpl-local'

import createMockRippled from './mockRippled'
import { getFreePort } from './testUtils'

async function setupMockRippledConnection(
  testcase,
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
  testcase,
  ports: number[],
): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const servers = ports.map((port) => `ws://localhost:${port}`)
    // eslint-disable-next-line @typescript-eslint/promise-function-async -- Not an async function
    testcase.mocks = ports.map(function (port) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return -- Correct type here
      return createMockRippled(port)
    })
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Needed for teardown
async function teardownClient(this: any, done: () => void): Promise<void> {
  this.client
    .disconnect()
    .then(() => {
      // eslint-disable-next-line no-negated-condition -- easier to understand with negation
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
