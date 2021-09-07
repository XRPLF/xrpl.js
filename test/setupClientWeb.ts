/* eslint-disable @typescript-eslint/explicit-module-boundary-types -- Necessary for test setup */
import { Client, BroadcastClient } from 'xrpl-local'

import { PortResponse } from './mockRippled'

const defaultPort = 34371
const baseUrl = 'ws://testripple.circleci.com:'

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Needed for setup
async function setupClient(this: any, port = defaultPort): Promise<void> {
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
      return new Promise<void>((resolve, reject) => {
        this.client = new Client(
          `${baseUrl}${(got as PortResponse).result.port}`,
        )
        this.client.connect().then(resolve).catch(reject)
      })
    })
    .then(async () => {
      return tclient.disconnect()
    })
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Needed for setup
async function setupBroadcast(this: any): Promise<void> {
  const servers = [defaultPort, defaultPort + 1].map(
    (port) => `${baseUrl}${port}`,
  )
  this.client = new BroadcastClient(servers)
  return new Promise<void>((resolve, reject) => {
    this.client.connect().then(resolve).catch(reject)
  })
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Needed for teardown
function teardownClient(this: any): undefined {
  if (this.client.isConnected()) {
    return this.client.disconnect() as undefined
  }
  return undefined
}

export { setupClient as setup, teardownClient as teardown, setupBroadcast }
