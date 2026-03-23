import { assert } from 'chai'

import { OfferCreate, TrustSet, Wallet } from '../../../src'
import serverUrl from '../serverUrl'
import {
  setupClient,
  teardownClient,
  type XrplIntegrationTestContext,
} from '../setup'
import {
  testTransaction,
  generateFundedWallet,
  submitTransaction,
} from '../utils'

// how long before each test case times out
const TIMEOUT = 20000

describe('OfferCreate', function () {
  let testContext: XrplIntegrationTestContext
  let wallet_deep_freeze_trustline: Wallet | undefined

  beforeAll(async () => {
    testContext = await setupClient(serverUrl)
    // eslint-disable-next-line require-atomic-updates -- race condition doesn't really matter
    wallet_deep_freeze_trustline ??= await generateFundedWallet(
      testContext.client,
    )
  })

  afterAll(async () => teardownClient(testContext))

  it(
    'base',
    async () => {
      const tx: OfferCreate = {
        TransactionType: 'OfferCreate',
        Account: testContext.wallet.classicAddress,
        TakerGets: '13100000',
        TakerPays: {
          currency: 'USD',
          issuer: testContext.wallet.classicAddress,
          value: '10',
        },
      }

      await testTransaction(testContext.client, tx, testContext.wallet)

      // confirm that the offer actually went through
      const accountOffersResponse = await testContext.client.request({
        command: 'account_offers',
        account: testContext.wallet.classicAddress,
      })
      assert.lengthOf(
        accountOffersResponse.result.offers!,
        1,
        'Should be exactly one offer on the ledger',
      )
    },
    TIMEOUT,
  )

  it(
    'OfferCreate with Deep-Frozen trustline must fail',
    async () => {
      assert(wallet_deep_freeze_trustline != null)

      // deep-freeze the trust line
      const trust_set_tx: TrustSet = {
        TransactionType: 'TrustSet',
        Account: testContext.wallet.classicAddress,
        LimitAmount: {
          currency: 'USD',
          issuer: wallet_deep_freeze_trustline.classicAddress,
          value: '10',
        },
        Flags: {
          tfSetFreeze: true,
          tfSetDeepFreeze: true,
        },
      }

      await testTransaction(
        testContext.client,
        trust_set_tx,
        testContext.wallet,
      )

      const offer_create_tx: OfferCreate = {
        TransactionType: 'OfferCreate',
        Account: testContext.wallet.classicAddress,
        TakerGets: '13100000',
        TakerPays: {
          currency: 'USD',
          issuer: wallet_deep_freeze_trustline.classicAddress,
          value: '10',
        },
      }

      const response = await submitTransaction({
        client: testContext.client,
        transaction: offer_create_tx,
        wallet: testContext.wallet,
      })

      assert.equal(response.result.engine_result, 'tecFROZEN')
    },
    TIMEOUT,
  )
})
