import { Client, BroadcastClient } from 'xrpl-local'

import { PortResponse } from './mockRippled'

const port = 34371
const baseUrl = 'ws://testripple.circleci.com:'

async function setup(this: any, port_ = port) {
  const tclient = new Client(baseUrl + port_)
  return tclient
    .connect()
    .then(async () => {
      return tclient.connection.request({
        command: 'test_command',
        data: { openOnOtherPort: true },
      })
    })
    .then(async (got) => {
      return new Promise<void>((resolve, reject) => {
        this.client = new Client(baseUrl + (got as PortResponse).result.port)
        this.client.connect().then(resolve).catch(reject)
      })
    })
    .then(async () => {
      return tclient.disconnect()
    })
}

async function setupBroadcast(this: any) {
  const servers = [port, port + 1].map((port_) => baseUrl + port_)
  this.client = new BroadcastClient(servers)
  return new Promise<void>((resolve, reject) => {
    this.client.connect().then(resolve).catch(reject)
  })
}

function teardown(this: any) {
  if (this.client.isConnected()) {
    return this.client.disconnect()
  }
  return undefined
}

export default {
  setup,
  teardown,
  setupBroadcast,
}
