import { assert } from 'chai'

import { LedgerRequest } from '../../../src'
import { Ledger, LedgerV1 } from '../../../src/models/ledger'
import serverUrl from '../serverUrl'
import {
  setupClient,
  teardownClient,
  type XrplIntegrationTestContext,
} from '../setup'

// how long before each test case times out
const TIMEOUT = 20000

describe('ledger', function () {
  let testContext: XrplIntegrationTestContext

  beforeEach(async () => {
    testContext = await setupClient(serverUrl)
  })
  afterEach(async () => teardownClient(testContext))

  it(
    'base',
    async () => {
      const ledgerRequest: LedgerRequest = {
        command: 'ledger',
        ledger_index: 'validated',
      }

      const expected = {
        api_version: 2,
        id: 0,
        result: {
          ledger: {
            accepted: true,
            account_hash: 'string',
            close_flags: 0,
            close_time: 0,
            close_time_human: 'string',
          },
          ledger_hash: 'string',
          ledger_index: 1,
          validated: true,
        },
        type: 'response',
      }

      const ledgerResponse = await testContext.client.request(ledgerRequest)

      assert.equal(ledgerResponse.type, expected.type)

      assert.equal(ledgerResponse.result.validated, expected.result.validated)
      assert.typeOf(ledgerResponse.result.ledger_hash, 'string')
      assert.typeOf(ledgerResponse.result.ledger_index, 'number')

      const ledger = ledgerResponse.result.ledger as Ledger & {
        accepted: boolean
        hash: string
        seqNum: string
      }
      assert.equal(ledger.closed, true)
      const stringTypes = [
        'account_hash',
        'close_time_human',
        'ledger_hash',
        'parent_hash',
        'total_coins',
        'transaction_hash',
      ]
      stringTypes.forEach((strType) => assert.typeOf(ledger[strType], 'string'))
      const numTypes = [
        'close_flags',
        'close_time',
        'close_time_resolution',
        'ledger_index',
        'parent_close_time',
      ]
      numTypes.forEach((numType) => assert.typeOf(ledger[numType], 'number'))
    },
    TIMEOUT,
  )

  it(
    'uses api_version 1',
    async () => {
      const ledgerRequest: LedgerRequest = {
        command: 'ledger',
        ledger_index: 'validated',
        api_version: 1,
      }

      const expected = {
        id: 0,
        result: {
          ledger: {
            accepted: true,
            account_hash: 'string',
            close_flags: 0,
            close_time: 0,
            close_time_human: 'string',
          },
          ledger_hash: 'string',
          ledger_index: 1,
          validated: true,
        },
        type: 'response',
      }

      const ledgerResponse = await testContext.client.request<LedgerRequest, 1>(
        ledgerRequest,
      )

      assert.equal(ledgerResponse.type, expected.type)

      assert.equal(ledgerResponse.result.validated, expected.result.validated)
      assert.typeOf(ledgerResponse.result.ledger_hash, 'string')
      assert.typeOf(ledgerResponse.result.ledger_index, 'number')

      const ledger = ledgerResponse.result.ledger as LedgerV1 & {
        accepted: boolean
        hash: string
        seqNum: string
      }
      assert.equal(ledger.closed, true)
      const stringTypes = [
        'account_hash',
        'close_time_human',
        'ledger_hash',
        'ledger_index',
        'parent_hash',
        'total_coins',
        'transaction_hash',
      ]
      stringTypes.forEach((strType) => assert.typeOf(ledger[strType], 'string'))
      const numTypes = [
        'close_flags',
        'close_time',
        'close_time_resolution',
        'parent_close_time',
      ]
      numTypes.forEach((numType) => assert.typeOf(ledger[numType], 'number'))
    },
    TIMEOUT,
  )
})
