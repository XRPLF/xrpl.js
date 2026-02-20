import { assert } from 'chai'

import { LedgerEntryRequest, LedgerEntryResponse } from '../../../src'
import type AMM from '../../../src/models/ledger/AMM'
import { createAMMPoolWithMPT } from '../mptUtils'
import serverUrl from '../serverUrl'
import {
  setupClient,
  teardownClient,
  type XrplIntegrationTestContext,
} from '../setup'
import { generateFundedWallet } from '../utils'

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

      const expectedResponse = {
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
    'binary = (default)',
    async () => {
      const wallet = await generateFundedWallet(testContext.client)

      const ledgerEntryResponse = await testContext.client.request({
        command: 'ledger_entry',
        account_root: wallet.address,
      })

      assert.isDefined(ledgerEntryResponse.result.node)
      // @ts-expect-error - node_binary is not present in the response
      assert.isUndefined(ledgerEntryResponse.result.node_binary)
    },
    TIMEOUT,
  )

  it(
    'binary = false',
    async () => {
      const wallet = await generateFundedWallet(testContext.client)

      const ledgerEntryResponse = await testContext.client.request({
        command: 'ledger_entry',
        account_root: wallet.address,
        binary: false,
      })

      assert.isDefined(ledgerEntryResponse.result.node)
      // @ts-expect-error - node_binary is not present in the response
      assert.isUndefined(ledgerEntryResponse.result.node_binary)
    },
    TIMEOUT,
  )

  it('binary = true', async () => {
    const wallet = await generateFundedWallet(testContext.client)

    const ledgerEntryResponse = await testContext.client.request({
      command: 'ledger_entry',
      account_root: wallet.address,
      binary: true,
    })

    // @ts-expect-error - node is not present in the response
    assert.isUndefined(ledgerEntryResponse.result.node)
    assert.isDefined(ledgerEntryResponse.result.node_binary)
  })

  it(
    'ledger_entry for AMM with MPT assets',
    async () => {
      const mptPool = await createAMMPoolWithMPT(testContext.client)
      const { asset, asset2 } = mptPool

      const ledgerEntryResponse = await testContext.client.request({
        command: 'ledger_entry',
        amm: {
          asset,
          asset2,
        },
      })

      assert.equal(ledgerEntryResponse.type, 'response')

      const node = ledgerEntryResponse.result.node as unknown as AMM
      assert.equal(node.LedgerEntryType, 'AMM')
      assert.deepEqual(node.Asset, {
        mpt_issuance_id: asset.mpt_issuance_id,
      })
      assert.deepEqual(node.Asset2, {
        mpt_issuance_id: asset2.mpt_issuance_id,
      })
      assert.equal(node.TradingFee, 12)
      assert.ok(node.LPTokenBalance)
      assert.ok(node.Account)
    },
    TIMEOUT,
  )
})
