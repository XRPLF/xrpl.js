import { assert } from 'chai'

import { Client } from '../../src'
import createMockRippled, {
  type MockedWebSocketServer,
} from '../createMockRippled'
import rippled from '../fixtures/rippled'
import { destroyServer, getFreePort } from '../testUtils'

const TIMEOUT = 20000

describe('client.getServerInfo', function () {
  let mockRippled: MockedWebSocketServer
  let client: Client
  let port: number

  beforeEach(async () => {
    port = await getFreePort()
    mockRippled = createMockRippled(port)
    client = new Client(`ws://localhost:${port}`)
    client.on('error', () => {
      // Required to avoid unhandled error events from reconnect attempts
    })
  })

  afterEach(async () => {
    if (client.isConnected()) {
      await client.disconnect()
    }
    await new Promise<void>((resolve) => {
      mockRippled.close(() => resolve())
    })
    await destroyServer(port)
  })

  it(
    'connect() rejects when server_info request fails',
    async () => {
      mockRippled.addResponse('server_info', {
        id: 0,
        status: 'error',
        type: 'response',
        error: 'noNetwork',
        error_code: 17,
        error_message: 'Not synced to the network.',
        request: { command: 'server_info', id: 0 },
      })

      let connectError: Error | undefined
      try {
        await client.connect()
      } catch (err) {
        connectError = err as Error
      }

      assert.isDefined(
        connectError,
        'connect() should reject when server_info fails so that signed transactions cannot accidentally omit NetworkID',
      )
      assert.strictEqual(client.networkID, undefined)
      assert.strictEqual(client.buildVersion, undefined)
    },
    TIMEOUT,
  )

  it(
    'getServerInfo() throws when server_info request fails',
    async () => {
      mockRippled.addResponse('server_info', rippled.server_info.withNetworkId)
      await client.connect()

      mockRippled.addResponse('server_info', {
        id: 0,
        status: 'error',
        type: 'response',
        error: 'noNetwork',
        error_code: 17,
        error_message: 'Not synced to the network.',
        request: { command: 'server_info', id: 0 },
      })

      let getServerInfoError: Error | undefined
      try {
        await client.getServerInfo()
      } catch (err) {
        getServerInfoError = err as Error
      }

      assert.isDefined(
        getServerInfoError,
        'getServerInfo() should propagate the underlying request error rather than swallow it',
      )
    },
    TIMEOUT,
  )

  it(
    'connect() populates networkID and buildVersion on success',
    async () => {
      mockRippled.addResponse('server_info', rippled.server_info.withNetworkId)

      await client.connect()

      assert.strictEqual(
        client.networkID,
        rippled.server_info.withNetworkId.result.info.network_id,
      )
      assert.strictEqual(
        client.buildVersion,
        rippled.server_info.withNetworkId.result.info.build_version,
      )
    },
    TIMEOUT,
  )

  it(
    'connect() rejects when server_info succeeds without network_id',
    async () => {
      const responseWithoutNetworkId = JSON.parse(
        JSON.stringify(rippled.server_info.withNetworkId),
      )
      delete responseWithoutNetworkId.result.info.network_id
      mockRippled.addResponse('server_info', responseWithoutNetworkId)

      let connectError: Error | undefined
      try {
        await client.connect()
      } catch (err) {
        connectError = err as Error
      }

      assert.isDefined(
        connectError,
        'connect() should reject when server_info returns no network_id, since signing without a known network ID can produce cross-network-replayable transactions',
      )
      assert.strictEqual(client.networkID, undefined)
    },
    TIMEOUT,
  )

  it(
    'getServerInfo() throws when server_info succeeds without network_id',
    async () => {
      mockRippled.addResponse('server_info', rippled.server_info.withNetworkId)
      await client.connect()

      const responseWithoutNetworkId = JSON.parse(
        JSON.stringify(rippled.server_info.withNetworkId),
      )
      delete responseWithoutNetworkId.result.info.network_id
      mockRippled.addResponse('server_info', responseWithoutNetworkId)

      let getServerInfoError: Error | undefined
      try {
        await client.getServerInfo()
      } catch (err) {
        getServerInfoError = err as Error
      }

      assert.isDefined(
        getServerInfoError,
        'getServerInfo() should throw when server_info returns no network_id, since signing without a known network ID can produce cross-network-replayable transactions',
      )
    },
    TIMEOUT,
  )
})
