import { Client, BroadcastClient } from 'xrpl-local'

import { createMockRippled } from './mockRippled'
import { getFreePort } from './testUtils'

async function setupMockRippledConnection(testcase, port) {
  return new Promise<void>((resolve, reject) => {
    testcase.mockRippled = createMockRippled(port)
    testcase._mockedServerPort = port
    testcase.client = new Client(`ws://localhost:${port}`)
    testcase.client.connect().then(resolve).catch(reject)
  })
}

async function setupMockRippledConnectionForBroadcast(testcase, ports) {
  return new Promise<void>((resolve, reject) => {
    const servers = ports.map((port) => `ws://localhost:${port}`)
    testcase.mocks = ports.map((port) => createMockRippled(port))
    testcase.client = new BroadcastClient(servers)
    testcase.client.connect().then(resolve).catch(reject)
  })
}

async function setup(this: any) {
  return getFreePort().then(async (port) => {
    return setupMockRippledConnection(this, port)
  })
}

async function setupBroadcast(this: any) {
  return Promise.all([getFreePort(), getFreePort()]).then(async (ports) => {
    return setupMockRippledConnectionForBroadcast(this, ports)
  })
}

function teardown(this: any, done) {
  this.client
    .disconnect()
    .then(() => {
      if (this.mockRippled != null) {
        this.mockRippled.close()
      } else {
        this.mocks.forEach((mock) => mock.close())
      }
      setImmediate(done)
    })
    .catch(done)
}

export default {
  setup,
  teardown,
  setupBroadcast,
  createMockRippled,
}
