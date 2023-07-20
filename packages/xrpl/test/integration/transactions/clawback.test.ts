import { assert } from 'chai'

import {
  AccountSet,
  AccountSetAsfFlags,
  TrustSet,
  Payment,
  Clawback,
} from '../../../src'
import serverUrl from '../serverUrl'
import {
  setupClient,
  teardownClient,
  type XrplIntegrationTestContext,
} from '../setup'
import { generateFundedWallet, testTransaction } from '../utils'

// how long before each test case times out
const TIMEOUT = 20000

describe('Clawback', function () {
  let testContext: XrplIntegrationTestContext

  beforeEach(async () => {
    testContext = await setupClient(serverUrl)
  })
  afterEach(async () => teardownClient(testContext))

  it(
    'base',
    async () => {
      const wallet2 = await generateFundedWallet(testContext.client)

      const setupAccountSetTx: AccountSet = {
        TransactionType: 'AccountSet',
        Account: testContext.wallet.classicAddress,
        SetFlag: AccountSetAsfFlags.asfAllowTrustLineClawback,
      }
      await testTransaction(
        testContext.client,
        setupAccountSetTx,
        testContext.wallet,
      )

      const setupTrustSetTx: TrustSet = {
        TransactionType: 'TrustSet',
        Account: wallet2.classicAddress,
        LimitAmount: {
          currency: 'USD',
          issuer: testContext.wallet.classicAddress,
          value: '1000',
        },
      }
      await testTransaction(testContext.client, setupTrustSetTx, wallet2)

      const setupPaymentTx: Payment = {
        TransactionType: 'Payment',
        Account: testContext.wallet.classicAddress,
        Destination: wallet2.classicAddress,
        Amount: {
          currency: 'USD',
          issuer: testContext.wallet.classicAddress,
          value: '1000',
        },
      }
      await testTransaction(
        testContext.client,
        setupPaymentTx,
        testContext.wallet,
      )

      // verify that line is created
      const objectsResponse = await testContext.client.request({
        command: 'account_objects',
        account: wallet2.classicAddress,
        type: 'state',
      })
      assert.lengthOf(
        objectsResponse.result.account_objects,
        1,
        'Should be exactly one line on the ledger',
      )

      // actual test - clawback
      const tx: Clawback = {
        TransactionType: 'Clawback',
        Account: testContext.wallet.classicAddress,
        Amount: {
          currency: 'USD',
          issuer: wallet2.classicAddress,
          value: '500',
        },
      }
      await testTransaction(testContext.client, tx, testContext.wallet)

      // verify amount clawed back
      const linesResponse = await testContext.client.request({
        command: 'account_lines',
        account: wallet2.classicAddress,
      })

      assert.lengthOf(
        linesResponse.result.lines,
        1,
        'Should be exactly one line on the ledger',
      )
      assert.equal(
        '500',
        linesResponse.result.lines[0].balance,
        `Holder balance incorrect after Clawback`,
      )
    },
    TIMEOUT,
  )
})
