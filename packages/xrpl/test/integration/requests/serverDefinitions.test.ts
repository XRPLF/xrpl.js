import { assert } from 'chai'

import { type ServerDefinitionsRequest } from '../../../src'
import serverUrl from '../serverUrl'
import {
  setupClient,
  teardownClient,
  type XrplIntegrationTestContext,
} from '../setup'

// how long before each test case times out
const TIMEOUT = 20000

describe('server_definitions', function () {
  let testContext: XrplIntegrationTestContext

  beforeEach(async () => {
    testContext = await setupClient(serverUrl)
  })
  afterEach(async () => teardownClient(testContext))

  it(
    'base',
    async () => {
      const request: ServerDefinitionsRequest = {
        command: 'server_definitions',
      }
      const response = await testContext.client.request(request)
      assert.equal(response.type, 'response')
      assert.exists(response.result)

      const result = response.result
      assert.hasAllKeys(result, [
        'hash',
        'FIELDS',
        'LEDGER_ENTRY_TYPES',
        'TRANSACTION_RESULTS',
        'TRANSACTION_TYPES',
        'TYPES',
      ])

      assert.typeOf(result.hash, 'string')

      assert.typeOf(result.FIELDS, 'array')
      for (const field of result.FIELDS!) {
        assert.typeOf(field[0], 'string')
        assert.hasAllKeys(field[1], [
          'nth',
          'isVLEncoded',
          'isSerialized',
          'isSigningField',
          'type',
        ])
        assert.typeOf(field[1].nth, 'number')
        assert.typeOf(field[1].isVLEncoded, 'boolean')
        assert.typeOf(field[1].isSerialized, 'boolean')
        assert.typeOf(field[1].isSigningField, 'boolean')
        assert.typeOf(field[1].type, 'string')
      }

      assert.typeOf(result.LEDGER_ENTRY_TYPES, 'object')
      Object.entries(result.LEDGER_ENTRY_TYPES!).forEach(([key, value]) => {
        assert.typeOf(key, 'string')
        assert.typeOf(value, 'number')
      })

      assert.typeOf(result.TRANSACTION_RESULTS, 'object')
      Object.entries(result.TRANSACTION_RESULTS!).forEach(([key, value]) => {
        assert.typeOf(key, 'string')
        assert.typeOf(value, 'number')
      })

      assert.typeOf(result.TRANSACTION_TYPES, 'object')
      Object.entries(result.TRANSACTION_TYPES!).forEach(([key, value]) => {
        assert.typeOf(key, 'string')
        assert.typeOf(value, 'number')
      })

      assert.typeOf(result.TYPES, 'object')
      Object.entries(result.TYPES!).forEach(([key, value]) => {
        assert.typeOf(key, 'string')
        assert.typeOf(value, 'number')
      })
    },
    TIMEOUT,
  )

  it(
    'with same hash',
    async () => {
      const initialRequest: ServerDefinitionsRequest = {
        command: 'server_definitions',
      }
      const hash = (await testContext.client.request(initialRequest)).result
        .hash

      const request: ServerDefinitionsRequest = {
        command: 'server_definitions',
        hash,
      }
      const response = await testContext.client.request(request)
      assert.equal(response.type, 'response')
      assert.exists(response.result)

      const result = response.result
      assert.doesNotHaveAnyKeys(result, [
        'FIELDS',
        'LEDGER_ENTRY_TYPES',
        'TRANSACTION_RESULTS',
        'TRANSACTION_TYPES',
        'TYPES',
      ])

      assert.equal(result.hash, hash)
    },
    TIMEOUT,
  )
})
