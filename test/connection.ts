/* eslint-disable max-statements -- test has a lot of statements */
import net from 'net'

import { assert } from 'chai'
import _ from 'lodash'

import {
  Client,
  ConnectionError,
  DisconnectedError,
  NotConnectedError,
  ResponseFormatError,
  XrplError,
  TimeoutError,
} from 'xrpl-local'
import { Connection } from 'xrpl-local/client/connection'

import rippled from './fixtures/rippled'
import { setupClient, teardownClient } from './setupClient'
import { assertRejects, ignoreWebSocketDisconnect } from './testUtils'

// how long before each test case times out
const TIMEOUT = 20000

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Necessary to get browser info
const isBrowser = (process as any).browser

async function createServer(): Promise<net.Server> {
  return new Promise((resolve, reject) => {
    const server = net.createServer()
    server.on('listening', function () {
      resolve(server)
    })
    server.on('error', function (error) {
      reject(error)
    })
    server.listen(0, '0.0.0.0')
  })
}

describe('Connection', function () {
  this.timeout(TIMEOUT)
  beforeEach(setupClient)
  afterEach(teardownClient)

  it('default options', function () {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Need to access private methods
    const connection: any = new Connection('url')
    assert.strictEqual(connection.getUrl(), 'url')
    assert(connection.config.proxy == null)
    assert(connection.config.authorization == null)
  })

  describe('trace', function () {
    let mockedRequestData
    let mockedResponse
    let expectedMessages
    let originalConsoleLog

    beforeEach(function () {
      mockedRequestData = { mocked: 'request' }
      mockedResponse = JSON.stringify({ mocked: 'response', id: 0 })
      expectedMessages = [
        // We add the ID here, since it's not a part of the user-provided request.
        ['send', JSON.stringify({ ...mockedRequestData, id: 0 })],
        ['receive', mockedResponse],
      ]
      // eslint-disable-next-line no-console -- Testing trace
      originalConsoleLog = console.log
    })

    afterEach(function () {
      // eslint-disable-next-line no-console -- Testing trace
      console.log = originalConsoleLog
    })

    it('as false', function () {
      const messages: Array<[number | string, string]> = []
      // eslint-disable-next-line no-console -- Testing trace
      console.log = function (id: number, message: string): void {
        messages.push([id, message])
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Need to access private methods
      const connection: any = new Connection('url', { trace: false })
      connection.ws = {
        send(): void {
          /* purposefully empty */
        },
      }
      connection.request(mockedRequestData)
      connection.onMessage(mockedResponse)
      assert.deepEqual(messages, [])
    })

    it('as true', function () {
      const messages: Array<[number | string, string]> = []
      // eslint-disable-next-line no-console -- Testing trace
      console.log = function (id: number | string, message: string): void {
        messages.push([id, message])
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Need to access private methods
      const connection: any = new Connection('url', { trace: true })
      connection.ws = {
        send(): void {
          /* purposefully empty */
        },
      }
      connection.request(mockedRequestData)
      connection.onMessage(mockedResponse)
      assert.deepEqual(messages, expectedMessages)
    })

    it('as a function', function () {
      const messages: Array<[number | string, string]> = []
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Need to access private methods
      const connection: any = new Connection('url', {
        trace(id: number | string, message: string): void {
          messages.push([id, message])
        },
      })
      connection.ws = {
        send(): void {
          /* purposefully empty */
        },
      }
      connection.request(mockedRequestData)
      connection.onMessage(mockedResponse)
      assert.deepEqual(messages, expectedMessages)
    })
  })

  it('with proxy', function (done) {
    if (isBrowser) {
      done()
      return
    }
    createServer().then((server: net.Server) => {
      const port = (server.address() as net.AddressInfo).port
      const options = {
        proxy: `ws://localhost:${port}`,
        authorization: 'authorization',
        trustedCertificates: ['path/to/pem'],
      }
      const connection = new Connection(this.client.connection.url, options)
      const expect = 'CONNECT localhost'

      server.on('connection', (socket) => {
        socket.on('data', (data) => {
          const got = data.toString('ascii', 0, expect.length)
          assert.strictEqual(got, expect)
          server.close()
          connection.disconnect()
          done()
        })
      })

      connection.connect().catch((err) => {
        assert(err instanceof NotConnectedError)
      })
    }, done)
  })

  it('Multiply disconnect calls', async function () {
    this.client.disconnect()
    this.client.disconnect()
  })

  it('reconnect', function () {
    this.client.connection.reconnect()
  })

  it('NotConnectedError', async function () {
    const connection = new Connection('url')
    return connection
      .request({
        command: 'ledger',
        ledger_index: 'validated',
      })
      .then(() => {
        assert.fail('Should throw NotConnectedError')
      })
      .catch((error) => {
        assert(error instanceof NotConnectedError)
      })
  })

  it('should throw NotConnectedError if server not responding ', function (done) {
    if (isBrowser) {
      if (navigator.userAgent.includes('PhantomJS')) {
        // inside PhantomJS this one just hangs, so skip as not very relevant
        done()
        return
      }
    }

    // Address where no one listens
    const connection = new Connection('ws://testripple.circleci.com:129')
    connection.on('error', done)
    connection.connect().catch((error) => {
      assert(error instanceof NotConnectedError)
      done()
    })
  })

  it('DisconnectedError', async function () {
    this.client
      .request({ command: 'test_command', data: { closeServer: true } })
      .then(() => {
        assert.fail('Should throw DisconnectedError')
      })
      .catch((error) => {
        assert(error instanceof DisconnectedError)
      })
  })

  it('TimeoutError', function () {
    this.client.connection.ws.send = function (_ignore, sendCallback): void {
      sendCallback(null)
    }
    const request = { command: 'server_info' }
    this.client.connection
      .request(request, 10)
      .then(() => {
        assert.fail('Should throw TimeoutError')
      })
      .catch((error) => {
        assert(error instanceof TimeoutError)
      })
  })

  it('DisconnectedError on send', function () {
    this.client.connection.ws.send = function (_ignore, sendCallback): void {
      sendCallback({ message: 'not connected' })
    }
    this.client
      .request({ command: 'server_info' })
      .then(() => {
        assert.fail('Should throw DisconnectedError')
      })
      .catch((error) => {
        assert(error instanceof DisconnectedError)
        assert.strictEqual(error.message, 'not connected')
      })
  })

  it('DisconnectedError on initial onOpen send', async function () {
    // onOpen previously could throw PromiseRejectionHandledWarning: Promise rejection was handled asynchronously
    // do not rely on the client.setup hook to test this as it bypasses the case, disconnect client connection first
    await this.client.disconnect()

    // stub _onOpen to only run logic relevant to test case
    this.client.connection.onOpen = (): void => {
      // overload websocket send on open when _ws exists
      this.client.connection.ws.send = function (_0, _1, _2): void {
        // recent ws throws this error instead of calling back
        throw new Error('WebSocket is not open: readyState 0 (CONNECTING)')
      }
      const request = { command: 'subscribe', streams: ['ledger'] }
      this.client.connection.request(request)
    }

    try {
      await this.client.connect()
    } catch (error) {
      if (!(error instanceof Error)) {
        throw error
      }

      assert.instanceOf(error, DisconnectedError)
      assert.strictEqual(
        error.message,
        'WebSocket is not open: readyState 0 (CONNECTING)',
      )
    }
  })

  it('ResponseFormatError', function () {
    this.client
      .request({
        command: 'test_command',
        data: { unrecognizedResponse: true },
      })
      .then(() => {
        assert.fail('Should throw ResponseFormatError')
      })
      .catch((error) => {
        assert(error instanceof ResponseFormatError)
      })
  })

  it('reconnect on unexpected close', function (done) {
    this.client.connection.on('connected', () => {
      done()
    })
    setTimeout(() => {
      this.client.connection.ws.close()
    }, 1)
  })

  describe('reconnection test', function () {
    it('reconnect on several unexpected close', function (done) {
      if (isBrowser) {
        if (navigator.userAgent.includes('PhantomJS')) {
          // inside PhantomJS this one just hangs, so skip as not very relevant
          done()
          return
        }
      }
      this.timeout(70001)
      // eslint-disable-next-line @typescript-eslint/no-this-alias -- Avoid shadow alias
      const self = this
      function breakConnection(): void {
        self.client.connection
          .request({
            command: 'test_command',
            data: { disconnectIn: 10 },
          })
          .catch(ignoreWebSocketDisconnect)
      }

      let connectsCount = 0
      let disconnectsCount = 0
      let reconnectsCount = 0
      let code = 0
      this.client.connection.on('reconnecting', () => {
        reconnectsCount += 1
      })
      this.client.connection.on('disconnected', (_code) => {
        code = _code
        disconnectsCount += 1
      })
      const num = 3
      this.client.connection.on('connected', () => {
        connectsCount += 1
        if (connectsCount < num) {
          breakConnection()
        }
        if (connectsCount === num) {
          if (disconnectsCount !== num) {
            done(
              new Error(
                `disconnectsCount must be equal to ${num}(got ${disconnectsCount} instead)`,
              ),
            )
          } else if (reconnectsCount !== num) {
            done(
              new Error(
                `reconnectsCount must be equal to ${num} (got ${reconnectsCount} instead)`,
              ),
            )
            // eslint-disable-next-line no-negated-condition -- Necessary
          } else if (code !== 1006) {
            done(
              new Error(`disconnect must send code 1006 (got ${code} instead)`),
            )
          } else {
            done()
          }
        }
      })

      breakConnection()
    })
  })

  it('reconnect event on heartbeat failure', function (done) {
    if (isBrowser) {
      if (navigator.userAgent.includes('PhantomJS')) {
        // inside PhantomJS this one just hangs, so skip as not very relevant
        done()
        return
      }
    }
    // Set the heartbeat to less than the 1 second ping response
    this.client.connection.config.timeout = 500
    // Drop the test runner timeout, since this should be a quick test
    this.timeout(5000)
    // Hook up a listener for the reconnect event
    this.client.connection.on('reconnect', () => done())
    // Trigger a heartbeat
    this.client.connection.heartbeat().catch((_error) => {
      /* Ignore error */
    })
  })

  it('heartbeat failure and reconnect failure', function (done) {
    if (isBrowser) {
      if (navigator.userAgent.includes('PhantomJS')) {
        // inside PhantomJS this one just hangs, so skip as not very relevant
        done()
        return
      }
    }
    // Set the heartbeat to less than the 1 second ping response
    this.client.connection.config.timeout = 500
    // Drop the test runner timeout, since this should be a quick test
    this.timeout(5000)
    // fail on reconnect/connection
    this.client.connection.reconnect = async (): Promise<void> => {
      throw new Error('error on reconnect')
    }
    // Hook up a listener for the reconnect error event
    this.client.on('error', (error, message) => {
      if (error === 'reconnect' && message === 'error on reconnect') {
        return done()
      }
      return done(new Error('Expected error on reconnect'))
    })
    // Trigger a heartbeat
    this.client.connection.heartbeat()
  })

  it('should emit disconnected event with code 1000 (CLOSE_NORMAL)', function (done) {
    this.client.once('disconnected', (code) => {
      assert.strictEqual(code, 1000)
      done()
    })
    this.client.disconnect()
  })

  it('should emit disconnected event with code 1006 (CLOSE_ABNORMAL)', function (done) {
    this.client.connection.once('error', (error) => {
      done(new Error(`should not throw error, got ${String(error)}`))
    })
    this.client.connection.once('disconnected', (code) => {
      assert.strictEqual(code, 1006)
      done()
    })
    this.client.connection
      .request({
        command: 'test_command',
        data: { disconnectIn: 10 },
      })
      .catch(ignoreWebSocketDisconnect)
  })

  it('should emit connected event on after reconnect', function (done) {
    this.client.once('connected', done)
    this.client.connection.ws.close()
  })

  it('Multiply connect calls', function () {
    this.client.connect().then(() => {
      this.client.connect()
    })
  })

  it('Cannot connect because no server', async function () {
    const connection = new Connection(undefined as unknown as string)
    return connection
      .connect()
      .then(() => {
        assert.fail('Should throw ConnectionError')
      })
      .catch((error) => {
        assert(error instanceof ConnectionError, 'Should throw ConnectionError')
      })
  })

  it('connect multiserver error', function () {
    assert.throws(function () {
      // eslint-disable-next-line no-new -- Testing constructor
      new Client({
        servers: ['wss://server1.com', 'wss://server2.com'],
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Testing invalid constructor
      } as any)
    }, XrplError)
  })

  it('connect throws error', function (done) {
    this.client.once('error', (type, info) => {
      assert.strictEqual(type, 'type')
      assert.strictEqual(info, 'info')
      done()
    })
    this.client.connection.emit('error', 'type', 'info')
  })

  it('emit stream messages', function (done) {
    let transactionCount = 0
    let pathFindCount = 0
    this.client.connection.on('transaction', () => {
      transactionCount += 1
    })
    this.client.connection.on('path_find', () => {
      pathFindCount += 1
    })
    this.client.connection.on('response', (message) => {
      assert.strictEqual(message.id, 1)
      assert.strictEqual(transactionCount, 1)
      assert.strictEqual(pathFindCount, 1)
      done()
    })

    this.client.connection.onMessage(
      JSON.stringify({
        type: 'transaction',
      }),
    )
    this.client.connection.onMessage(
      JSON.stringify({
        type: 'path_find',
      }),
    )
    this.client.connection.onMessage(
      JSON.stringify({
        type: 'response',
        id: 1,
      }),
    )
  })

  it('invalid message id', function (done) {
    this.client.on('error', (errorCode, errorMessage, message) => {
      assert.strictEqual(errorCode, 'badMessage')
      assert.strictEqual(errorMessage, 'valid id not found in response')
      assert.strictEqual(message, '{"type":"response","id":{}}')
      done()
    })
    this.client.connection.onMessage(
      JSON.stringify({
        type: 'response',
        id: {},
      }),
    )
  })

  it('propagates error message', function (done) {
    this.client.on('error', (errorCode, errorMessage, data) => {
      assert.strictEqual(errorCode, 'slowDown')
      assert.strictEqual(errorMessage, 'slow down')
      assert.deepEqual(data, { error: 'slowDown', error_message: 'slow down' })
      done()
    })
    this.client.connection.onMessage(
      JSON.stringify({
        error: 'slowDown',
        error_message: 'slow down',
      }),
    )
  })

  it('propagates RippledError data', function (done) {
    const request = { command: 'subscribe', streams: 'validations' }
    this.mockRippled.addResponse(request.command, rippled.subscribe.error)

    this.client.request(request).catch((error) => {
      assert.strictEqual(error.name, 'RippledError')
      assert.strictEqual(error.data.error, 'invalidParams')
      assert.strictEqual(error.message, 'Invalid parameters.')
      assert.strictEqual(error.data.error_code, 31)
      assert.strictEqual(error.data.error_message, 'Invalid parameters.')
      assert.deepEqual(error.data.request, {
        command: 'subscribe',
        id: 0,
        streams: 'validations',
      })
      done()
    })
  })

  it('unrecognized message type', function (done) {
    // This enables us to automatically support any
    // new messages added by rippled in the future.
    this.client.connection.on('unknown', (event) => {
      assert.deepEqual(event, { type: 'unknown' })
      done()
    })

    this.client.connection.onMessage(JSON.stringify({ type: 'unknown' }))
  })

  // it('should clean up websocket connection if error after websocket is opened', async function () {
  //   await this.client.disconnect()
  //   // fail on connection
  //   this.client.connection.subscribeToLedger = async () => {
  //     throw new Error('error on _subscribeToLedger')
  //   }
  //   try {
  //     await this.client.connect()
  //     throw new Error('expected connect() to reject, but it resolved')
  //   } catch (err) {
  //     assert(err.message === 'error on _subscribeToLedger')
  //     // _ws.close event listener should have cleaned up the socket when disconnect _ws.close is run on connection error
  //     // do not fail on connection anymore
  //     this.client.connection.subscribeToLedger = async () => {}
  //     await this.client.connection.reconnect()
  //   }
  // })

  it('should try to reconnect on empty subscribe response on reconnect', function (done) {
    this.timeout(23000)
    this.client.on('error', (error) => {
      done(error || new Error('Should not emit error.'))
    })
    let disconnectedCount = 0
    this.client.on('connected', () => {
      done(
        disconnectedCount === 1
          ? undefined
          : new Error('Wrong number of disconnects'),
      )
    })
    this.client.on('disconnected', () => {
      disconnectedCount += 1
    })
    this.client.connection.request({
      command: 'test_command',
      data: { disconnectIn: 5 },
    })
  })

  it('should not crash on error', async function (done) {
    this.mockRippled.suppressOutput = true
    this.client.connection
      .request({
        command: 'test_garbage',
      })
      .then(() => new Error('Should not have succeeded'))
      .catch(done())
  })

  it('should throw error if pending response with same ID', async function () {
    const promise1 = this.client.connection.request({
      id: 'test',
      command: 'ping',
    })
    const promise2 = this.client.connection.request({
      id: 'test',
      command: 'ping',
    })
    await assertRejects(
      Promise.all([promise1, promise2]),
      XrplError,
      "Response with id 'test' is already pending",
    )
  })
})
