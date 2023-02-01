import { assert } from 'chai'

import { OfferCreate, OfferCancel } from '../../../src'
import serverUrl from '../serverUrl'
import {
  setupClient,
  teardownClient,
  type XrplIntegrationTestContext,
} from '../setup'
import { testTransaction } from '../utils'

// how long before each test case times out
const TIMEOUT = 20000

describe('OfferCancel', function () {
  let testContext: XrplIntegrationTestContext

  beforeEach(async () => {
    testContext = await setupClient(serverUrl)
  })
  afterEach(async () => teardownClient(testContext))

  it(
    'base',
    async () => {
      // set up an offer
      const setupTx: OfferCreate = {
        TransactionType: 'OfferCreate',
        Account: testContext.wallet.classicAddress,
        TakerGets: '13100000',
        TakerPays: {
          currency: 'USD',
          issuer: testContext.wallet.classicAddress,
          value: '10',
        },
      }

      await testTransaction(testContext.client, setupTx, testContext.wallet)

      const accountOffersResponse = await testContext.client.request({
        command: 'account_offers',
        account: testContext.wallet.classicAddress,
      })
      assert.lengthOf(
        accountOffersResponse.result.offers!,
        1,
        'Should be exactly one offer on the ledger',
      )
      const seq = accountOffersResponse.result.offers?.[0].seq

      assert.isNumber(seq)

      // actually test OfferCancel
      const tx: OfferCancel = {
        TransactionType: 'OfferCancel',
        Account: testContext.wallet.classicAddress,
        OfferSequence: seq!,
      }

      await testTransaction(testContext.client, tx, testContext.wallet)

      const accountOffersResponse2 = await testContext.client.request({
        command: 'account_offers',
        account: testContext.wallet.classicAddress,
      })
      assert.lengthOf(
        accountOffersResponse2.result.offers!,
        0,
        'Should not be any offers on the ledger',
      )
    },
    TIMEOUT,
  )
})
