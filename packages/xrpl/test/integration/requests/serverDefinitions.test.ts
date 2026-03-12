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

function assertStringNumberMap(map: Record<string, number>): void {
  assert.typeOf(map, 'object')
  Object.entries(map).forEach(([key, value]) => {
    assert.typeOf(key, 'string')
    assert.typeOf(value, 'number')
  })
}

function assertFields(
  fields: Array<
    [
      string,
      {
        nth: number
        isVLEncoded: boolean
        isSerialized: boolean
        isSigningField: boolean
        type: string
      },
    ]
  >,
): void {
  assert.typeOf(fields, 'array')
  for (const field of fields) {
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
}

function assertFlagsMap(map: Record<string, Record<string, number>>): void {
  assert.typeOf(map, 'object')
  Object.entries(map).forEach(([name, flags]) => {
    assert.typeOf(name, 'string')
    assert.typeOf(flags, 'object')
    Object.entries(flags).forEach(([flagName, flagValue]) => {
      assert.typeOf(flagName, 'string')
      assert.typeOf(flagValue, 'number')
    })
  })
}

function assertFormatsMap(
  map: Record<string, Array<{ name: string; optionality: number }>>,
): void {
  assert.typeOf(map, 'object')
  Object.entries(map).forEach(([name, fields]) => {
    assert.typeOf(name, 'string')
    assert.isArray(fields)
    for (const field of fields) {
      assert.typeOf(field.name, 'string')
      assert.typeOf(field.optionality, 'number')
    }
  })
}

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
        'ACCOUNT_SET_FLAGS',
        'LEDGER_ENTRY_FLAGS',
        'LEDGER_ENTRY_FORMATS',
        'TRANSACTION_FLAGS',
        'TRANSACTION_FORMATS',
      ])

      assert.typeOf(result.hash, 'string')
      assertFields(result.FIELDS!)
      assertStringNumberMap(result.LEDGER_ENTRY_TYPES!)
      assertStringNumberMap(result.TRANSACTION_RESULTS!)
      assertStringNumberMap(result.TRANSACTION_TYPES!)
      assertStringNumberMap(result.TYPES!)
      assertStringNumberMap(result.ACCOUNT_SET_FLAGS!)

      assertFlagsMap(result.LEDGER_ENTRY_FLAGS!)
      assertFormatsMap(result.LEDGER_ENTRY_FORMATS!)
      assertFlagsMap(result.TRANSACTION_FLAGS!)
      assertFormatsMap(result.TRANSACTION_FORMATS!)
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
