import _ from 'lodash'
import net from 'net'
import assert from 'assert-diff'
import setupClient from './setup-client'
import {Client} from 'xrpl-local'
import {ignoreWebSocketDisconnect} from './utils'
const utils = Client._PRIVATE.ledgerUtils

const TIMEOUT = 200000 // how long before each test case times out
const isBrowser = (process as any).browser

function createServer() {
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
  beforeEach(setupClient.setup)
  afterEach(setupClient.teardown)

  it('default options', function () {
    const connection: any = new utils.Connection('url')
    assert.strictEqual(connection._url, 'url')
    assert(connection._config.proxy == null)
    assert(connection._config.authorization == null)
  })

  describe('trace', () => {
    const mockedRequestData = {mocked: 'request'}
    const mockedResponse = JSON.stringify({mocked: 'response', id: 0})
    const expectedMessages = [
      // We add the ID here, since it's not a part of the user-provided request.
      ['send', JSON.stringify({...mockedRequestData, id: 0})],
      ['receive', mockedResponse]
    ]
    const originalConsoleLog = console.log

    afterEach(() => {
      console.log = originalConsoleLog
    })

    it('as false', function () {
      const messages = []
      console.log = (id, message) => messages.push([id, message])
      const connection: any = new utils.Connection('url', {trace: false})
      connection._ws = {send: function () {}}
      connection.request(mockedRequestData)
      connection._onMessage(mockedResponse)
      assert.deepEqual(messages, [])
    })

    it('as true', function () {
      const messages = []
      console.log = (id, message) => messages.push([id, message])
      const connection: any = new utils.Connection('url', {trace: true})
      connection._ws = {send: function () {}}
      connection.request(mockedRequestData)
      connection._onMessage(mockedResponse)
      assert.deepEqual(messages, expectedMessages)
    })

    it('as a function', function () {
      const messages = []
      const connection: any = new utils.Connection('url', {
        trace: (id, message) => messages.push([id, message])
      })
      connection._ws = {send: function () {}}
      connection.request(mockedRequestData)
      connection._onMessage(mockedResponse)
      assert.deepEqual(messages, expectedMessages)
    })
  })

  it('with proxy', function (done) {
    if (isBrowser) {
      done()
      return
    }
    createServer().then((server: any) => {
      const port = server.address().port
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

      const options = {
        proxy: 'ws://localhost:' + port,
        authorization: 'authorization',
        trustedCertificates: ['path/to/pem']
      }
      const connection = new utils.Connection(
        this.client.connection._url,
        options
      )
      connection.connect().catch((err) => {
        assert(err instanceof this.client.errors.NotConnectedError)
      })
    }, done)
  })

  it('Multiply disconnect calls', function () {
    this.client.disconnect()
    return this.client.disconnect()
  })

  it('reconnect', function () {
    return this.client.connection.reconnect()
  })

  it('NotConnectedError', function () {
    const connection = new utils.Connection('url')
    return connection.request({
        command: 'ledger', 
        ledger_index: 'validated'
      })
      .then(() => {
        assert(false, 'Should throw NotConnectedError')
      })
      .catch((error) => {
        assert(error instanceof this.client.errors.NotConnectedError)
      })
  })

  it('should throw NotConnectedError if server not responding ', function (done) {
    if (isBrowser) {
      const phantomTest = /PhantomJS/
      if (phantomTest.test(navigator.userAgent)) {
        // inside PhantomJS this one just hangs, so skip as not very relevant
        done()
        return
      }
    }

    // Address where no one listens
    const connection = new utils.Connection(
      'ws://testripple.circleci.com:129'
    )
    connection.on('error', done)
    connection.connect().catch((error) => {
      assert(error instanceof this.client.errors.NotConnectedError)
      done()
    })
  })

  it('DisconnectedError', async function () {
    this.mockRippled.on(`request_server_info`, function (request, conn) {
      assert.strictEqual(request.command, 'server_info')
      conn.close()
    })
    return this.client
      .request({command: "server_info"})
      .then(() => {
        assert(false, 'Should throw DisconnectedError')
      })
      .catch((error) => {
        assert(error instanceof this.client.errors.DisconnectedError)
      })
  })

  it('TimeoutError', function () {
    this.client.connection._ws.send = function (message, options, callback) {
      callback(null)
    }
    const request = {command: 'server_info'}
    return this.client.connection
      .request(request, 10)
      .then(() => {
        assert(false, 'Should throw TimeoutError')
      })
      .catch((error) => {
        assert(error instanceof this.client.errors.TimeoutError)
      })
  })

  it('DisconnectedError on send', function () {
    this.client.connection._ws.send = function (message, options, callback) {
      callback({message: 'not connected'})
    }
    return this.client
      .request({command: "server_info"})
      .then(() => {
        assert(false, 'Should throw DisconnectedError')
      })
      .catch((error) => {
        assert(error instanceof this.client.errors.DisconnectedError)
        assert.strictEqual(error.message, 'not connected')
      })
  })

  it('DisconnectedError on initial _onOpen send', async function () {
    // _onOpen previously could throw PromiseRejectionHandledWarning: Promise rejection was handled asynchronously
    // do not rely on the client.setup hook to test this as it bypasses the case, disconnect client connection first
    await this.client.disconnect()

    // stub _onOpen to only run logic relevant to test case
    this.client.connection._onOpen = () => {
      // overload websocket send on open when _ws exists
      this.client.connection._ws.send = function (data, options, cb) {
        // recent ws throws this error instead of calling back
        throw new Error('WebSocket is not open: readyState 0 (CONNECTING)')
      }
      const request = {command: 'subscribe', streams: ['ledger']}
      return this.client.connection.request(request)
    }

    try {
      await this.client.connect()
    } catch (error) {
      assert(error instanceof this.client.errors.DisconnectedError)
      assert.strictEqual(
        error.message,
        'WebSocket is not open: readyState 0 (CONNECTING)'
      )
    }
  })

  it('ResponseFormatError', function () {
    return this.client
      .request({command: 'test_command', data: {unrecognizedResponse: true}})
      .then(() => {
        assert(false, 'Should throw ResponseFormatError')
      })
      .catch((error) => {
        assert(error instanceof this.client.errors.ResponseFormatError)
      })
  })

  it('reconnect on unexpected close', function (done) {
    this.client.connection.on('connected', () => {
      done()
    })
    setTimeout(() => {
      this.client.connection._ws.close()
    }, 1)
  })

  describe('reconnection test', function () {
    it('reconnect on several unexpected close', function (done) {
      if (isBrowser) {
        const phantomTest = /PhantomJS/
        if (phantomTest.test(navigator.userAgent)) {
          // inside PhantomJS this one just hangs, so skip as not very relevant
          done()
          return
        }
      }
      this.timeout(70001)
      const self = this
      function breakConnection() {
        self.client.connection
          .request({
            command: 'test_command',
            data: {disconnectIn: 10}
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
                'disconnectsCount must be equal to ' +
                  num +
                  '(got ' +
                  disconnectsCount +
                  ' instead)'
              )
            )
          } else if (reconnectsCount !== num) {
            done(
              new Error(
                'reconnectsCount must be equal to ' +
                  num +
                  ' (got ' +
                  reconnectsCount +
                  ' instead)'
              )
            )
          } else if (code !== 1006) {
            done(
              new Error(
                'disconnect must send code 1006 (got ' + code + ' instead)'
              )
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
      const phantomTest = /PhantomJS/
      if (phantomTest.test(navigator.userAgent)) {
        // inside PhantomJS this one just hangs, so skip as not very relevant
        done()
        return
      }
    }
    // Set the heartbeat to less than the 1 second ping response
    this.client.connection._config.timeout = 500
    // Drop the test runner timeout, since this should be a quick test
    this.timeout(5000)
    // Hook up a listener for the reconnect event
    this.client.connection.on('reconnect', () => done())
    // Trigger a heartbeat
    this.client.connection._heartbeat().catch((error) => {
      /* ignore - test expects heartbeat failure */
    })
  })

  it('heartbeat failure and reconnect failure', function (done) {
    if (isBrowser) {
      const phantomTest = /PhantomJS/
      if (phantomTest.test(navigator.userAgent)) {
        // inside PhantomJS this one just hangs, so skip as not very relevant
        done()
        return
      }
    }
    // Set the heartbeat to less than the 1 second ping response
    this.client.connection._config.timeout = 500
    // Drop the test runner timeout, since this should be a quick test
    this.timeout(5000)
    // fail on reconnect/connection
    this.client.connection.reconnect = async () => {
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
    this.client.connection._heartbeat()
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
      done(new Error('should not throw error, got ' + String(error)))
    })
    this.client.connection.once('disconnected', (code) => {
      assert.strictEqual(code, 1006)
      done()
    })
    this.client.connection
      .request({
        command: 'test_command',
        data: {disconnectIn: 10}
      })
      .catch(ignoreWebSocketDisconnect)
  })

  it('should emit connected event on after reconnect', function (done) {
    this.client.once('connected', done)
    this.client.connection._ws.close()
  })

  it('Multiply connect calls', function () {
    return this.client.connect().then(() => {
      return this.client.connect()
    })
  })

  it('Cannot connect because no server', function () {
    const connection = new utils.Connection(undefined as string)
    return connection
      .connect()
      .then(() => {
        assert(false, 'Should throw ConnectionError')
      })
      .catch((error) => {
        assert(
          error instanceof this.client.errors.ConnectionError,
          'Should throw ConnectionError'
        )
      })
  })

  it('connect multiserver error', function () {
    assert.throws(function () {
      new Client({
        servers: ['wss://server1.com', 'wss://server2.com']
      } as any)
    }, this.client.errors.RippleError)
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
      transactionCount++
    })
    this.client.connection.on('path_find', () => {
      pathFindCount++
    })
    this.client.connection.on('response', (message) => {
      assert.strictEqual(message.id, 1)
      assert.strictEqual(transactionCount, 1)
      assert.strictEqual(pathFindCount, 1)
      done()
    })

    this.client.connection._onMessage(
      JSON.stringify({
        type: 'transaction'
      })
    )
    this.client.connection._onMessage(
      JSON.stringify({
        type: 'path_find'
      })
    )
    this.client.connection._onMessage(
      JSON.stringify({
        type: 'response',
        id: 1
      })
    )
  })

  it('invalid message id', function (done) {
    this.client.on('error', (errorCode, errorMessage, message) => {
      assert.strictEqual(errorCode, 'badMessage')
      assert.strictEqual(errorMessage, 'valid id not found in response')
      assert.strictEqual(message, '{"type":"response","id":"must be integer"}')
      done()
    })
    this.client.connection._onMessage(
      JSON.stringify({
        type: 'response',
        id: 'must be integer'
      })
    )
  })

  it('propagates error message', function (done) {
    this.client.on('error', (errorCode, errorMessage, data) => {
      assert.strictEqual(errorCode, 'slowDown')
      assert.strictEqual(errorMessage, 'slow down')
      assert.deepEqual(data, {error: 'slowDown', error_message: 'slow down'})
      done()
    })
    this.client.connection._onMessage(
      JSON.stringify({
        error: 'slowDown',
        error_message: 'slow down'
      })
    )
  })

  it('propagates RippledError data', function (done) {
    this.client.request({command: 'subscribe', streams: 'validations'}).catch((error) => {
      assert.strictEqual(error.name, 'RippledError')
      assert.strictEqual(error.data.error, 'invalidParams')
      assert.strictEqual(error.message, 'Invalid parameters.')
      assert.strictEqual(error.data.error_code, 31)
      assert.strictEqual(error.data.error_message, 'Invalid parameters.')
      assert.deepEqual(error.data.request, {
        command: 'subscribe',
        id: 0,
        streams: 'validations'
      })
      assert.strictEqual(error.data.status, 'error')
      assert.strictEqual(error.data.type, 'response')
      done()
    })
  })

  it('unrecognized message type', function (done) {
    // This enables us to automatically support any
    // new messages added by rippled in the future.
    this.client.connection.on('unknown', (event) => {
      assert.deepEqual(event, {type: 'unknown'})
      done()
    })

    this.client.connection._onMessage(JSON.stringify({type: 'unknown'}))
  })

  // it('should clean up websocket connection if error after websocket is opened', async function () {
  //   await this.client.disconnect()
  //   // fail on connection
  //   this.client.connection._subscribeToLedger = async () => {
  //     throw new Error('error on _subscribeToLedger')
  //   }
  //   try {
  //     await this.client.connect()
  //     throw new Error('expected connect() to reject, but it resolved')
  //   } catch (err) {
  //     assert(err.message === 'error on _subscribeToLedger')
  //     // _ws.close event listener should have cleaned up the socket when disconnect _ws.close is run on connection error
  //     // do not fail on connection anymore
  //     this.client.connection._subscribeToLedger = async () => {}
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
        disconnectedCount !== 1
          ? new Error('Wrong number of disconnects')
          : undefined
      )
    })
    this.client.on('disconnected', () => {
      disconnectedCount++
    })
    this.client.connection.request({
      command: 'test_command',
      data: {disconnectIn: 5}
    })
  })
})
