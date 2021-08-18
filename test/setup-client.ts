import {Client, BroadcastClient} from 'xrpl-local'
import ledgerClosed from './fixtures/rippled/ledger-close.json'
import {createMockRippled} from './mock-rippled'
import {getFreePort} from './utils'

function setupMockRippledConnection(testcase, port) {
  return new Promise<void>((resolve, reject) => {
    testcase.mockRippled = createMockRippled(port)
    testcase._mockedServerPort = port
    testcase.client = new Client('ws://localhost:' + port)
    testcase.client
      .connect()
      .then(() => {
        testcase.client.once('ledger', () => resolve())
        testcase.client.connection._ws.emit(
          'message',
          JSON.stringify(ledgerClosed)
        )
      })
      .catch(reject)
  })
}

function setupMockRippledConnectionForBroadcast(testcase, ports) {
  return new Promise<void>((resolve, reject) => {
    const servers = ports.map((port) => 'ws://localhost:' + port)
    testcase.mocks = ports.map((port) => createMockRippled(port))
    testcase.client = new BroadcastClient(servers)
    testcase.client
      .connect()
      .then(() => {
        testcase.client.once('ledger', () => resolve())
        testcase.mocks[0].socket.send(JSON.stringify(ledgerClosed))
      })
      .catch(reject)
  })
}

function setup(this: any) {
  return getFreePort().then((port) => {
    return setupMockRippledConnection(this, port)
  })
}

function setupBroadcast(this: any) {
  return Promise.all([getFreePort(), getFreePort()]).then((ports) => {
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
  setup: setup,
  teardown: teardown,
  setupBroadcast: setupBroadcast,
  createMockRippled: createMockRippled
}
