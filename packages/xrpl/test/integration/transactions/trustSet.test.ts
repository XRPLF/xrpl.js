import { assert } from 'chai'
import omit from 'lodash/omit'

import { TrustSet, percentToQuality, Wallet } from '../../../src'
import { AccountObjectsRequest } from '../../../src/models/methods/accountObjects'
import serverUrl from '../serverUrl'
import {
  setupClient,
  teardownClient,
  type XrplIntegrationTestContext,
} from '../setup'
import { generateFundedWallet, testTransaction } from '../utils'

// how long before each test case times out
const TIMEOUT = 20000

describe('TrustSet', function () {
  let testContext: XrplIntegrationTestContext
  let wallet2: Wallet | undefined

  beforeEach(async () => {
    testContext = await setupClient(serverUrl)
    if (!wallet2) {
      // eslint-disable-next-line require-atomic-updates -- race condition doesn't really matter
      wallet2 = await generateFundedWallet(testContext.client)
    }
  })
  afterEach(async () => teardownClient(testContext))

  it(
    'base',
    async () => {
      assert(wallet2 != null)
      const tx: TrustSet = {
        TransactionType: 'TrustSet',
        Account: testContext.wallet.classicAddress,
        LimitAmount: {
          currency: 'USD',
          issuer: wallet2.classicAddress,
          value: '100',
        },
      }

      await testTransaction(testContext.client, tx, testContext.wallet)
    },
    TIMEOUT,
  )

  it(
    'Quality < 1',
    async () => {
      assert(wallet2 != null)
      const tx: TrustSet = {
        TransactionType: 'TrustSet',
        Account: testContext.wallet.address,
        QualityIn: percentToQuality('99%'),
        QualityOut: percentToQuality('99%'),
        LimitAmount: {
          currency: 'BTC',
          issuer: wallet2.address,
          value: '100',
        },
      }

      await testTransaction(testContext.client, tx, testContext.wallet)
    },
    TIMEOUT,
  )

  it(
    'Quality > 1',
    async () => {
      assert(wallet2 != null)
      const tx: TrustSet = {
        TransactionType: 'TrustSet',
        QualityIn: percentToQuality('101%'),
        QualityOut: percentToQuality('101%'),
        Account: testContext.wallet.address,
        LimitAmount: {
          currency: 'ETH',
          issuer: wallet2.address,
          value: '100',
        },
      }

      await testTransaction(testContext.client, tx, testContext.wallet)
    },
    TIMEOUT,
  )

  it(
    'verify the deletion of trust lines',
    async () => {
      assert(wallet2 != null)
      const trustLineCreatetx: TrustSet = {
        TransactionType: 'TrustSet',
        Account: testContext.wallet.classicAddress,
        LimitAmount: {
          currency: 'USD',
          issuer: wallet2.classicAddress,
          value: '100',
        },
      }

      await testTransaction(
        testContext.client,
        trustLineCreatetx,
        testContext.wallet,
      )

      const trustLineDeletetx: TrustSet = {
        TransactionType: 'TrustSet',
        Account: testContext.wallet.classicAddress,
        LimitAmount: {
          currency: 'USD',
          issuer: wallet2.classicAddress,
          value: '0',
        },
      }

      await testTransaction(
        testContext.client,
        trustLineDeletetx,
        testContext.wallet,
      )

      // verify the contents of account objects
      const request: AccountObjectsRequest = {
        command: 'account_objects',
        account: testContext.wallet.classicAddress,
        ledger_index: 'validated',
      }
      const response = await testContext.client.request(request)
      const expected = {
        id: 0,
        result: {
          account: testContext.wallet.classicAddress,
          account_objects: [],
          validated: true,
        },
        type: 'response',
      }

      assert.lengthOf(
        response.result.account_objects,
        0,
        'There must be no trust lines after the reset-to-default TrustSet operation\n',
      )
      assert.equal(response.type, expected.type)
      assert.deepEqual(
        omit(response.result, ['ledger_hash', 'ledger_index']),
        expected.result,
      )
    },
    TIMEOUT,
  )
})
