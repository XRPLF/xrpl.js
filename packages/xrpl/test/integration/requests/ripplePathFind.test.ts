import { assert } from 'chai'

import { RipplePathFindRequest, RipplePathFindResponse } from '../../../src'
import { createMPTIssuanceAndAuthorize } from '../mptUtils'
import serverUrl from '../serverUrl'
import {
  setupClient,
  teardownClient,
  type XrplIntegrationTestContext,
} from '../setup'
import { generateFundedWallet } from '../utils'

// how long before each test case times out
const TIMEOUT = 20000

describe('ripple_path_find', function () {
  let testContext: XrplIntegrationTestContext

  beforeEach(async () => {
    testContext = await setupClient(serverUrl)
  })
  afterEach(async () => teardownClient(testContext))

  it(
    'base',
    async () => {
      const wallet2 = await generateFundedWallet(testContext.client)
      const ripplePathFind: RipplePathFindRequest = {
        command: 'ripple_path_find',
        subcommand: 'create',
        source_account: testContext.wallet.classicAddress,
        destination_account: wallet2.classicAddress,
        destination_amount: '100',
      }

      const response = await testContext.client.request(ripplePathFind)

      const expectedResponse: RipplePathFindResponse = {
        api_version: 2,
        id: response.id,
        type: 'response',
        result: {
          alternatives: response.result.alternatives,
          destination_account: wallet2.classicAddress,
          destination_currencies: response.result.destination_currencies,
          destination_amount: ripplePathFind.destination_amount,
          full_reply: true,
          id: response.id,
          ledger_current_index: response.result.ledger_current_index,
          source_account: ripplePathFind.source_account,
          validated: false,
        },
      }

      assert.deepEqual(response, expectedResponse)
    },
    TIMEOUT,
  )

  it(
    'ripple_path_find with MPT',
    async () => {
      const issuerWallet = await generateFundedWallet(testContext.client)
      const paymentDestinationWallet = await generateFundedWallet(
        testContext.client,
      )

      const mptIssuanceId = await createMPTIssuanceAndAuthorize(
        testContext.client,
        issuerWallet,
        paymentDestinationWallet,
      )

      const ripplePathFind: RipplePathFindRequest = {
        command: 'ripple_path_find',
        subcommand: 'create',
        source_account: issuerWallet.classicAddress,
        destination_account: paymentDestinationWallet.classicAddress,
        // @ts-expect-error -- MPTAmount support will be added to RipplePathFindRequest.destination_amount
        destination_amount: {
          mpt_issuance_id: mptIssuanceId,
          value: '100',
        },
      }

      const response = await testContext.client.request(ripplePathFind)

      assert.equal(response.type, 'response')
      assert.deepEqual(response.result.destination_amount, {
        mpt_issuance_id: mptIssuanceId,
        value: '100',
      })
      assert.isAtLeast(
        response.result.alternatives.length,
        1,
        'Should find at least one alternative path',
      )
    },
    TIMEOUT,
  )
})
