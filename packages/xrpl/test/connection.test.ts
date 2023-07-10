/* eslint-disable max-len -- Some large lines necessary */
/* eslint-disable max-statements -- test has a lot of statements */
import net from 'net'

import { assert } from 'chai'

import {
  Client,
  ConnectionError,
  DisconnectedError,
  NotConnectedError,
  ResponseFormatError,
  XrplError,
  TimeoutError,
} from '../src'
import { Connection } from '../src/client/connection'

import rippled from './fixtures/rippled'
import {
  setupClient,
  teardownClient,
  type XrplTestContext,
} from './setupClient'
import { assertRejects, ignoreWebSocketDisconnect } from './testUtils'

type GlobalThis = typeof globalThis
type Global = GlobalThis & {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Necessary for Jest in browser
  TextEncoder: any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Necessary for Jest in browser
  TextDecoder: any
}
declare const global: Global

if (typeof TextDecoder === 'undefined') {
  // eslint-disable-next-line node/global-require, @typescript-eslint/no-require-imports, node/prefer-global/text-encoder, global-require, @typescript-eslint/no-var-requires -- Needed for Jest
  global.TextEncoder = require('util').TextEncoder
  // eslint-disable-next-line node/global-require, @typescript-eslint/no-require-imports, node/prefer-global/text-decoder, global-require, @typescript-eslint/no-var-requires -- Needed for Jest
  global.TextDecoder = require('util').TextDecoder
}

// how long before each test case times out
const TIMEOUT = 20000

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Necessary to get browser info
const isBrowser = (process as any).browser

let lastSocketKey = 0
const socketMap: { [socketKey: string]: net.Socket } = {}

async function destroyServer(server: net.Server): Promise<void> {
  /* loop through all sockets and destroy them */
  Object.keys(socketMap).forEach(function (socketKey) {
    socketMap[socketKey].destroy()
  })

  return new Promise((resolve, reject) => {
    // after all the sockets are destroyed, we may close the server!
    server.close((error) => {
      if (error) {
        reject(error)
        return
      }

      resolve()
    })
  })
}

async function createServer(): Promise<net.Server> {
  return new Promise((resolve, reject) => {
    const server = net.createServer()
    server.on('listening', function () {
      resolve(server)
    })
    server.on('error', function (error) {
      reject(error)
    })
    const listener = server.listen(0, '0.0.0.0')
    // Keep track of all connections so we can destroy them at the end of the test
    // This will prevent Jest from having open handles when all tests are done
    listener.on('connection', (socket) => {
      // generate a new, unique socket-key
      lastSocketKey += 1
      const socketKey = lastSocketKey
      // add socket when it is connected
      socketMap[socketKey] = socket
      socket.on('close', () => {
        // remove socket when it is closed
        // eslint-disable-next-line @typescript-eslint/no-dynamic-delete -- Necessary to delete key
        delete socketMap[socketKey]
      })
    })
  })
}

describe('Connection', function () {
  let clientContext: XrplTestContext

  beforeEach(async () => {
    // console.log(`before: `, expect.getState().currentTestName)
    clientContext = await setupClient()
  })
  afterEach(async () => {
    // console.log(`after: `, expect.getState().currentTestName)
    await teardownClient(clientContext!)
  })

  it(
    'default options',
    async () => {
      const connection = new Connection('url')
      assert.strictEqual(connection.getUrl(), 'url')
      // @ts-expect-error -- Accessing private property for testing
      assert(connection.config.proxy == null)
      // @ts-expect-error -- Accessing private property for testing
      assert(connection.config.authorization == null)
    },
    TIMEOUT,
  )

  describe('trace', function () {
    let mockedRequestData
    let mockedResponse
    let expectedMessages
    let originalConsoleLog

    beforeEach(async () => {
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

    afterEach(async () => {
      // eslint-disable-next-line no-console -- Testing trace
      console.log = originalConsoleLog
    })

    it(
      'as false',
      async () => {
        const messages: Array<[number | string, string]> = []
        // eslint-disable-next-line no-console -- Testing trace
        console.log = function (id: number, message: string): void {
          messages.push([id, message])
        }
        const connection = new Connection('url', { trace: false })
        // @ts-expect-error -- Accessing private property for testing
        connection.ws = {
          send(): void {
            /* purposefully empty */
          },
        }
        const requestPromise = connection.request(mockedRequestData, 10)
        // @ts-expect-error -- Accessing private property for testing
        connection.onMessage(mockedResponse)
        assert.deepEqual(messages, [])
        await requestPromise.catch(() => {
          // ignore error, we intentionally fail the promise
        })
      },
      TIMEOUT,
    )

    it(
      'as true',
      async () => {
        const messages: Array<[number | string, string]> = []
        // eslint-disable-next-line no-console -- Testing trace
        console.log = function (id: number | string, message: string): void {
          messages.push([id, message])
        }
        const connection = new Connection('url', { trace: true })
        // @ts-expect-error -- Accessing private methods for test
        connection.ws = {
          send(): void {
            /* purposefully empty */
          },
        }
        const requestPromise = connection.request(mockedRequestData, 10)
        // @ts-expect-error -- Accessing private methods for test
        connection.onMessage(mockedResponse)
        assert.deepEqual(messages, expectedMessages)
        await requestPromise.catch(() => {
          // ignore error, we intentionally fail the promise
        })
      },
      TIMEOUT,
    )

    it(
      'as a function',
      async () => {
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
        const requestPromise = connection.request(mockedRequestData, 10)
        connection.onMessage(mockedResponse)
        assert.deepEqual(messages, expectedMessages)
        await requestPromise.catch(() => {
          // ignore error, we intentionally fail the promise
        })
      },
      TIMEOUT,
    )
  })

  it(
    'with proxy',
    async () => {
      if (isBrowser) {
        return
      }
      const server = await createServer()
      const port = (server.address() as net.AddressInfo).port
      const options = {
        proxy: `ws://127.0.0.1:${port}`,
        authorization: 'authorization',
        trustedCertificates: ['path/to/pem'],
      }
      const connection = new Connection(
        // @ts-expect-error -- Testing private member
        clientContext.client.connection.url,
        options,
      )
      const expect = 'CONNECT localhost'

      const connectionPromise = new Promise<void>((resolve) => {
        server.on('error', () => {
          destroyServer(server).then(() => {
            resolve()
          })
        })
        server.on('connection', (socket) => {
          socket.on('data', (data) => {
            const got = data.toString('ascii', 0, expect.length)
            assert.strictEqual(got, expect)
            if (connection.isConnected()) {
              destroyServer(server)
                .then(async () => {
                  return connection.disconnect().catch((error) => {
                    // eslint-disable-next-line no-console -- Test
                    console.error('Failed to disconnect')
                    throw error
                  })
                })
                .then(() => {
                  resolve()
                })
            } else {
              destroyServer(server).then(resolve)
            }
          })
        })
      })

      await connection.connect().catch((err) => {
        assert(err instanceof NotConnectedError)
      })

      await connectionPromise
    },
    TIMEOUT,
  )

  it(
    'Multiply disconnect calls',
    async () => {
      await clientContext.client.disconnect()
      await clientContext.client.disconnect()
    },
    TIMEOUT,
  )

  it(
    'reconnect',
    async () => {
      await clientContext.client.connection.reconnect()
    },
    TIMEOUT,
  )

  it(
    'NotConnectedError',
    async () => {
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
    },
    TIMEOUT,
  )

  it(
    'should throw NotConnectedError if server not responding ',
    async () => {
      if (isBrowser) {
        if (navigator.userAgent.includes('PhantomJS')) {
          // inside PhantomJS this one just hangs, so skip as not very relevant
          return
        }
      }

      // Address where no one listens
      const connection = new Connection('ws://testripple.circleci.com:129')
      const errorPromise = new Promise((resolve) => {
        connection.on('error', resolve)
      })

      const connectionPromise = connection.connect().catch((error) => {
        assert(error instanceof NotConnectedError)
      })

      await new Promise((resolve) => {
        errorPromise.then(resolve)
        connectionPromise.then(resolve)
      })
    },
    TIMEOUT,
  )

  it(
    'DisconnectedError',
    async () => {
      await clientContext.client
        .request({ command: 'test_command', data: { closeServer: true } })
        .then(() => {
          assert.fail('Should throw DisconnectedError')
        })
        .catch((error) => {
          assert(error instanceof DisconnectedError)
        })
    },
    TIMEOUT,
  )

  it(
    'TimeoutError',
    async () => {
      // @ts-expect-error -- Testing private member
      clientContext.client.connection.ws.send = function (
        _ignore,
        sendCallback,
      ): void {
        sendCallback(null)
      }
      const request = { command: 'server_info' }
      await clientContext.client.connection
        .request(request, 10)
        .then(() => {
          assert.fail('Should throw TimeoutError')
        })
        .catch((error) => {
          assert(error instanceof TimeoutError)
        })
    },
    TIMEOUT,
  )

  it(
    'DisconnectedError on send',
    async () => {
      // @ts-expect-error -- Testing private member
      clientContext.client.connection.ws.send = function (
        _ignore,
        sendCallback,
      ): void {
        sendCallback({ message: 'not connected' })
      }
      await clientContext.client
        .request({ command: 'server_info' })
        .then(() => {
          assert.fail('Should throw DisconnectedError')
        })
        .catch((error) => {
          assert(error instanceof DisconnectedError)
          assert.strictEqual(error.message, 'not connected')
        })
    },
    TIMEOUT,
  )

  it(
    'DisconnectedError on initial onOpen send',
    async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Testing private member
      let spy: any

      // onOpen previously could throw PromiseRejectionHandledWarning: Promise rejection was handled asynchronously
      // do not rely on the client.setup hook to test this as it bypasses the case, disconnect client connection first
      await clientContext.client.disconnect()

      jest
        // @ts-expect-error -- Testing private member
        .spyOn(clientContext.client.connection, 'onceOpen')
        // @ts-expect-error -- Testing private member
        .mockImplementation(async () => {
          spy = jest
            // @ts-expect-error -- Testing private member
            .spyOn(clientContext.client.connection.ws, 'send')
            // @ts-expect-error -- Testing private member
            .mockImplementation((_0, _1, _2) => {
              return 0
            })

          const request = {
            command: 'subscribe',
            streams: ['ledger'],
            id: 'connectionSubscribe',
          }
          return clientContext.client.connection.request(request)
        })

      try {
        await clientContext.client.connect()
      } catch (error) {
        // @ts-expect-error -- error.message is expected to be defined
        expect(error.message).toEqual(
          "Error: connect() timed out after 5000 ms. If your internet connection is working, the rippled server may be blocked or inaccessible. You can also try setting the 'connectionTimeout' option in the Client constructor.",
        )
        expect(spy).toHaveBeenCalled()
        // @ts-expect-error -- Promise throws timeout error after test is done
        clientContext.client.connection.requestManager.resolve(
          'connectionSubscribe',
        )
      }
    },
    TIMEOUT,
  )

  it(
    'ResponseFormatError',
    async () => {
      await clientContext.client
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
    },
    TIMEOUT,
  )

  it(
    'reconnect on unexpected close',
    async () => {
      const connectedPromise = new Promise<void>((resolve) => {
        clientContext.client.connection.on('connected', () => {
          resolve()
        })
      })

      setTimeout(() => {
        // @ts-expect-error -- Testing private member
        clientContext.client.connection.ws.close()
      }, 1)

      await connectedPromise
    },
    TIMEOUT,
  )

  describe('reconnection test', function () {
    it('reconnect on several unexpected close', async function () {
      if (isBrowser) {
        if (navigator.userAgent.includes('PhantomJS')) {
          // inside PhantomJS this one just hangs, so skip as not very relevant
          return
        }
      }
      async function breakConnection(): Promise<void> {
        await clientContext.client.connection
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
      clientContext.client.connection.on('reconnecting', () => {
        reconnectsCount += 1
      })
      clientContext.client.connection.on('disconnected', (_code) => {
        code = _code
        disconnectsCount += 1
      })
      const num = 3

      const connectedPromise = new Promise<void>((resolve, reject) => {
        clientContext.client.connection.on('connected', () => {
          connectsCount += 1
          if (connectsCount < num) {
            breakConnection()
          }
          if (connectsCount === num) {
            if (disconnectsCount !== num) {
              reject(
                new XrplError(
                  `disconnectsCount must be equal to ${num}(got ${disconnectsCount} instead)`,
                ),
              )
            } else if (reconnectsCount !== num) {
              reject(
                new XrplError(
                  `reconnectsCount must be equal to ${num} (got ${reconnectsCount} instead)`,
                ),
              )
              // eslint-disable-next-line no-negated-condition -- Necessary
            } else if (code !== 1006) {
              reject(
                new XrplError(
                  `disconnect must send code 1006 (got ${code} instead)`,
                ),
              )
            } else {
              resolve()
            }
          }
        })
      })

      await breakConnection()
      await connectedPromise
    }, 70001)
  })

  it('reconnect event on heartbeat failure', async function () {
    if (isBrowser) {
      if (navigator.userAgent.includes('PhantomJS')) {
        // inside PhantomJS this one just hangs, so skip as not very relevant
        return
      }
    }

    // Set the heartbeat to less than the 1 second ping response
    // @ts-expect-error -- Testing private member
    clientContext.client.connection.config.timeout = 500

    const reconnectPromise = new Promise<void>((resolve) => {
      // Hook up a listener for the reconnect event
      clientContext.client.connection.on('reconnect', () => {
        resolve()
      })
    })

    // Trigger a heartbeat
    try {
      // @ts-expect-error -- Testing private member
      await clientContext.client.connection.heartbeat()
    } catch (_error) {
      // ignore
    }

    await reconnectPromise
  }, 5000)

  it('heartbeat failure and reconnect failure', async function () {
    if (isBrowser) {
      if (navigator.userAgent.includes('PhantomJS')) {
        // inside PhantomJS this one just hangs, so skip as not very relevant
        return
      }
    }

    // Set the heartbeat to less than the 1 second ping response
    // @ts-expect-error -- Testing private member
    clientContext.client.connection.config.timeout = 500
    // fail on reconnect/connection
    jest
      .spyOn(clientContext.client.connection, 'reconnect')
      .mockImplementation(async (): Promise<void> => {
        throw new XrplError('error on reconnect')
      })

    // clientContext?.client.connection.reconnect = async (): Promise<void> => {
    //   throw new XrplError('error on reconnect')
    // }

    const errorPromise = new Promise<void>((resolve, reject) => {
      // Hook up a listener for the reconnect error event
      clientContext.client.on('error', (error, message) => {
        if (error === 'reconnect' && message === 'error on reconnect') {
          return resolve()
        }
        return reject(new XrplError('Expected error on reconnect'))
      })
    })

    // Trigger a heartbeat
    // @ts-expect-error -- Testing private member
    await clientContext.client.connection.heartbeat()

    await errorPromise
  }, 5000)

  it(
    'should emit disconnected event with code 1000 (CLOSE_NORMAL)',
    async () => {
      const disconnectedPromise = new Promise<void>((resolve) => {
        clientContext.client.once('disconnected', (code) => {
          assert.strictEqual(code, 1000)
          resolve()
        })
      })

      await clientContext.client.disconnect()
      await disconnectedPromise
    },
    TIMEOUT,
  )

  it(
    'should emit disconnected event with code 1006 (CLOSE_ABNORMAL)',
    async () => {
      const errorPromise = new Promise<void>((resolve, reject) => {
        clientContext.client.connection.once('error', (error) => {
          reject(new XrplError(`should not throw error, got ${String(error)}`))
        })

        setTimeout(resolve, 5000)
      })

      const disconnectedPromise = new Promise<void>((resolve) => {
        clientContext.client.connection.once('disconnected', (code) => {
          assert.strictEqual(code, 1006)
          resolve()
        })
      })

      await clientContext.client.connection
        .request({
          command: 'test_command',
          data: { disconnectIn: 10 },
        })
        .catch(ignoreWebSocketDisconnect)

      await Promise.all([errorPromise, disconnectedPromise])
    },
    TIMEOUT,
  )

  it(
    'should emit connected event on after reconnect',
    async () => {
      const connectedPromise = new Promise<void>((resolve) => {
        clientContext.client.once('connected', resolve)
      })

      // @ts-expect-error -- Testing private member
      clientContext.client.connection.ws.close()
      await connectedPromise
    },
    TIMEOUT,
  )

  it(
    'Multiply connect calls',
    async () => {
      await clientContext.client.connect()
      await clientContext.client.connect()
    },
    TIMEOUT,
  )

  it(
    'Cannot connect because no server',
    async () => {
      const connection = new Connection(undefined as unknown as string)
      return connection
        .connect()
        .then(() => {
          assert.fail('Should throw ConnectionError')
        })
        .catch((error) => {
          assert(
            error instanceof ConnectionError,
            'Should throw ConnectionError',
          )
        })
    },
    TIMEOUT,
  )

  it(
    'connect multiserver error',
    () => {
      assert.throws(function () {
        // eslint-disable-next-line no-new -- Testing constructor
        new Client({
          servers: ['wss://server1.com', 'wss://server2.com'],
          // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Testing invalid constructor
        } as any)
      }, XrplError)
    },
    TIMEOUT,
  )

  it(
    'connect throws error',
    async () => {
      const errorPromise = new Promise<void>((resolve) => {
        clientContext.client.once('error', (type, info) => {
          assert.strictEqual(type, 'type')
          assert.strictEqual(info, 'info')
          resolve()
        })
      })

      clientContext.client.connection.emit('error', 'type', 'info')
      return errorPromise
    },
    TIMEOUT,
  )

  it(
    'emit stream messages',
    async () => {
      let transactionCount = 0
      let pathFindCount = 0
      clientContext.client.connection.on('transaction', () => {
        transactionCount += 1
      })
      clientContext.client.connection.on('path_find', () => {
        pathFindCount += 1
      })

      const responsePromise = new Promise<void>((resolve) => {
        clientContext.client.connection.on('response', (message) => {
          assert.strictEqual(message.id, 1)
          assert.strictEqual(transactionCount, 1)
          assert.strictEqual(pathFindCount, 1)
          resolve()
        })
      })

      // @ts-expect-error -- Testing private member
      clientContext.client.connection.onMessage(
        JSON.stringify({
          type: 'transaction',
        }),
      )
      // @ts-expect-error -- Testing private member
      clientContext.client.connection.onMessage(
        JSON.stringify({
          type: 'path_find',
        }),
      )
      // @ts-expect-error -- Testing private member
      clientContext.client.connection.onMessage(
        JSON.stringify({
          type: 'response',
          id: 1,
        }),
      )

      await responsePromise
    },
    TIMEOUT,
  )

  it(
    'invalid message id',
    async () => {
      const errorPromise = new Promise<void>((resolve) => {
        clientContext.client.on('error', (errorCode, errorMessage, message) => {
          assert.strictEqual(errorCode, 'badMessage')
          assert.strictEqual(errorMessage, 'valid id not found in response')
          assert.strictEqual(message, '{"type":"response","id":{}}')
          resolve()
        })
      })

      // @ts-expect-error -- Testing private member
      clientContext.client.connection.onMessage(
        JSON.stringify({
          type: 'response',
          id: {},
        }),
      )

      await errorPromise
    },
    TIMEOUT,
  )

  it(
    'propagates error message',
    async () => {
      const errorPromise = new Promise<void>((resolve) => {
        clientContext.client.on('error', (errorCode, errorMessage, data) => {
          assert.strictEqual(errorCode, 'slowDown')
          assert.strictEqual(errorMessage, 'slow down')
          assert.deepEqual(data, {
            error: 'slowDown',
            error_message: 'slow down',
          })
          resolve()
        })
      })

      // @ts-expect-error -- Testing private member
      clientContext.client.connection.onMessage(
        JSON.stringify({
          error: 'slowDown',
          error_message: 'slow down',
        }),
      )

      await errorPromise
    },
    TIMEOUT,
  )

  it(
    'propagates RippledError data',
    async () => {
      const request = { command: 'subscribe', streams: 'validations' }
      clientContext.mockRippled?.addResponse(
        request.command,
        rippled.subscribe.error,
      )

      await clientContext.client.request(request).catch((error) => {
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
      })
    },
    TIMEOUT,
  )

  it(
    'unrecognized message type',
    async () => {
      const unknownPromise = new Promise<void>((resolve) => {
        // This enables us to automatically support any
        // new messages added by rippled in the future.
        clientContext.client.connection.on('unknown', (event) => {
          assert.deepEqual(event, { type: 'unknown' })
          resolve()
        })
      })

      // @ts-expect-error -- Testing private member
      clientContext.client.connection.onMessage(
        JSON.stringify({ type: 'unknown' }),
      )

      await unknownPromise
    },
    TIMEOUT,
  )

  // it('should clean up websocket connection if error after websocket is opened', async function () {
  //   await clientContext.client.disconnect()
  //   // fail on connection
  //   // @ts-expect-error -- Testing private members
  //   clientContext.client.connection.subscribeToLedger =
  //     async (): Promise<void> => {
  //       throw new Error('error on _subscribeToLedger')
  //     }
  //   try {
  //     await clientContext.client.connect()
  //     throw new Error('expected connect() to reject, but it resolved')
  //   } catch (err) {
  //     assert(err.message === 'error on _subscribeToLedger')

  //     // _ws.close event listener should have cleaned up the socket when disconnect _ws.close is run on connection error
  //     // do not fail on connection anymore
  //     // @ts-expect-error -- Testing private members
  //     clientContext.client.connection.subscribeToLedger =
  //       async (): Promise<void> => {
  //         // Ignore this function
  //       }
  //     await clientContext.client.connection.reconnect()
  //   }
  // })

  it('should try to reconnect on empty subscribe response on reconnect', async function () {
    const errorPromise = new Promise<void>((resolve, reject) => {
      clientContext.client.on('error', (error) => {
        if (error) {
          reject(error)
        }

        reject(new XrplError('Should not emit error.'))
      })

      setTimeout(resolve, 5000)
    })

    let disconnectedCount = 0

    const connectedPromise = new Promise<void>((resolve) => {
      clientContext.client.on('connected', () => {
        if (disconnectedCount !== 1) {
          throw new XrplError('Wrong number of disconnects')
        }

        resolve()
      })
    })

    clientContext.client.on('disconnected', () => {
      disconnectedCount += 1
    })
    clientContext.client.connection.request({
      command: 'test_command',
      data: { disconnectIn: 5 },
    })

    await Promise.all([errorPromise, connectedPromise])
  }, 23000)

  it(
    'should not crash on error',
    async () => {
      if (clientContext.mockRippled) {
        clientContext.mockRippled.suppressOutput = true
      }

      await new Promise<void>((resolve, reject) => {
        clientContext.client.connection
          .request({
            command: 'test_garbage',
          })
          .then(() => reject(new XrplError('Should not have succeeded')))
          .catch(resolve)
      })
    },
    TIMEOUT,
  )

  it(
    'should throw error if pending response with same ID',
    async () => {
      const promise1 = clientContext.client.connection.request({
        id: 'test',
        command: 'ping',
      })
      const promise2 = clientContext.client.connection.request({
        id: 'test',
        command: 'ping',
      })
      await assertRejects(
        Promise.all([promise1, promise2]),
        XrplError,
        "Response with id 'test' is already pending",
      )
    },
    TIMEOUT,
  )
})
