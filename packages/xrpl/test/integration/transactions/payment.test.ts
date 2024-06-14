import { assert } from 'chai'

import { Payment, Wallet } from '../../../src'
import serverUrl from '../serverUrl'
import {
  setupClient,
  teardownClient,
  type XrplIntegrationTestContext,
} from '../setup'
import { generateFundedWallet, testTransaction } from '../utils'

// how long before each test case times out
const TIMEOUT = 20000

describe('Payment', function () {
  let testContext: XrplIntegrationTestContext
  let paymentTx: Payment
  const AMOUNT = '200000000'
  // This wallet is used for DeliverMax related tests
  let paymentTxWallet: Wallet

  beforeEach(async () => {
    testContext = await setupClient(serverUrl)
    paymentTxWallet = await generateFundedWallet(testContext.client)
    paymentTx = {
      TransactionType: 'Payment',
      Account: paymentTxWallet.classicAddress,
      Amount: AMOUNT,
      Destination: 'rfkE1aSy9G8Upk4JssnwBxhEv5p4mn2KTy',
    }
  })
  afterEach(async () => teardownClient(testContext))

  it(
    'base',
    async () => {
      const wallet2 = await generateFundedWallet(testContext.client)
      const tx: Payment = {
        TransactionType: 'Payment',
        Account: testContext.wallet.classicAddress,
        Destination: wallet2.classicAddress,
        Amount: '1000',
      }
      await testTransaction(testContext.client, tx, testContext.wallet)
    },
    TIMEOUT,
  )

  it(
    'Validate Payment transaction API v2: Payment Transaction: Specify Only Amount field',
    async () => {
      const result = await testTransaction(
        testContext.client,
        paymentTx,
        paymentTxWallet,
      )

      assert.equal(result.result.engine_result_code, 0)
      assert.equal((result.result.tx_json as Payment).Amount, AMOUNT)
    },
    TIMEOUT,
  )

  it(
    'Validate Payment transaction API v2: Payment Transaction: Specify Only DeliverMax field',
    async () => {
      // @ts-expect-error -- DeliverMax is a non-protocol, RPC level field in Payment transactions
      paymentTx.DeliverMax = paymentTx.Amount
      // @ts-expect-error -- DeliverMax is a non-protocol, RPC level field in Payment transactions
      delete paymentTx.Amount

      const result = await testTransaction(
        testContext.client,
        paymentTx,
        paymentTxWallet,
      )

      assert.equal(result.result.engine_result_code, 0)
      assert.equal((result.result.tx_json as Payment).Amount, AMOUNT)
    },
    TIMEOUT,
  )

  it(
    'Validate Payment transaction v2 API: Payment Transaction: identical DeliverMax and Amount fields',
    async () => {
      // @ts-expect-error -- DeliverMax is a non-protocol, RPC level field in Payment transactions
      paymentTx.DeliverMax = paymentTx.Amount

      const result = await testTransaction(
        testContext.client,
        paymentTx,
        paymentTxWallet,
      )

      assert.equal(result.result.engine_result_code, 0)
      assert.equal((result.result.tx_json as Payment).Amount, AMOUNT)
    },
    TIMEOUT,
  )
})
