import { assert } from 'chai'

import { LedgerEntryRequest, LedgerEntryResponse } from '../../../src'
import { createAMMPoolWithMPT } from '../mptUtils'
import serverUrl from '../serverUrl'
import {
  setupClient,
  teardownClient,
  type XrplIntegrationTestContext,
} from '../setup'

// how long before each test case times out
const TIMEOUT = 20000

describe('ledger_entry', function () {
  let testContext: XrplIntegrationTestContext

  beforeEach(async () => {
    testContext = await setupClient(serverUrl)
  })
  afterEach(async () => teardownClient(testContext))

  it(
    'base',
    async () => {
      const validatedLedgerResponse = await testContext.client.request({
        command: 'ledger_data',
        ledger_index: 'validated',
      })

      assert.equal(validatedLedgerResponse.type, 'response')
      const ledgerEntryIndex = validatedLedgerResponse.result.state[0].index

      const ledgerEntryRequest: LedgerEntryRequest = {
        command: 'ledger_entry',
        index: ledgerEntryIndex,
      }

      const ledgerEntryResponse =
        await testContext.client.request(ledgerEntryRequest)

      const expectedResponse: LedgerEntryResponse = {
        api_version: 2,
        id: ledgerEntryResponse.id,
        type: 'response',
        result: {
          index: ledgerEntryIndex,
          ledger_current_index: ledgerEntryResponse.result.ledger_current_index,
          node: ledgerEntryResponse.result.node,
          validated: false,
        },
      }

      assert.equal(ledgerEntryResponse.type, 'response')
      assert.deepEqual(ledgerEntryResponse, expectedResponse)
    },
    TIMEOUT,
  )

  it(
    'ledger_entry for AMM with MPT assets',
    async () => {
      const mptPool = await createAMMPoolWithMPT(testContext.client)
      const { asset, asset2 } = mptPool

      const ledgerEntryResponse = await testContext.client.request({
        command: 'ledger_entry',
        // @ts-expect-error -- AMM field with MPTCurrency support will be added to LedgerEntryRequest
        amm: {
          asset,
          asset2,
        },
      })

      assert.equal(ledgerEntryResponse.type, 'response')

      const node = ledgerEntryResponse.result.node
      // @ts-expect-error -- node type will be updated
      assert.equal(node.LedgerEntryType, 'AMM')
      // @ts-expect-error -- node type will be updated
      assert.deepEqual(node.Asset, {
        mpt_issuance_id: asset.mpt_issuance_id,
      })
      // @ts-expect-error -- node type will be updated
      assert.deepEqual(node.Asset2, {
        mpt_issuance_id: asset2.mpt_issuance_id,
      })
      // @ts-expect-error -- node type will be updated
      assert.equal(node.TradingFee, 12)
      // @ts-expect-error -- node type will be updated
      assert.ok(node.LPTokenBalance)
      // @ts-expect-error -- node type will be updated
      assert.ok(node.Account)
    },
    TIMEOUT,
  )
})
