import {Client, BroadcastClient} from 'xrpl-local'

const port = 34371
const baseUrl = 'ws://testripple.circleci.com:'

function setup(this: any, port_ = port) {
  const tclient = new Client(baseUrl + port_)
  return tclient
    .connect()
    .then(() => {
      return tclient.connection.request({
        // TODO: resolve when we redo the testing framework
        // @ts-ignore
        command: 'test_command',
        data: {openOnOtherPort: true}
      })
    })
    .then((got) => {
      return new Promise<void>((resolve, reject) => {
        // @ts-ignore
        this.client = new Client(baseUrl + got.port)
        this.client
          .connect()
          .then(resolve)
          .catch(reject)
      })
    })
    .then(() => {
      return tclient.disconnect()
    })
}

function setupBroadcast(this: any) {
  const servers = [port, port + 1].map((port_) => baseUrl + port_)
  this.client = new BroadcastClient(servers)
  return new Promise<void>((resolve, reject) => {
    this.client
      .connect()
      .then(resolve)
      .catch(reject)
  })
}

function teardown(this: any) {
  if (this.client.isConnected()) {
    return this.client.disconnect()
  }
  return undefined
}

export default {
  setup: setup,
  teardown: teardown,
  setupBroadcast: setupBroadcast
}
