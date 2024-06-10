import { assert } from 'chai'

import { Payment } from '../../../src'
// import { autofill } from '../../../src/client/index'
import { ValidationError } from '../../../src/errors'
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
  let payment_txn_example
  let amount_: string
  // This wallet is used for DeliverMax related tests
  let payment_txn_wallet

  beforeEach(async () => {
    testContext = await setupClient(serverUrl)
    amount_ = '200000000'
    payment_txn_wallet = await generateFundedWallet(testContext.client)
    payment_txn_example = {
      TransactionType: 'Payment',
      Account: payment_txn_wallet.classicAddress,
      Amount: amount_,
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
    'Validate Payment transaction v2 API: Payment Transaction: Specify Only Amount field',
    async () => {
      const result = await testTransaction(
        testContext.client,
        payment_txn_example,
        payment_txn_wallet,
      )

      assert.equal(result.result.engine_result_code, 0)
      assert.equal((result.result.tx_json as Payment).Amount, amount_)
    },
    TIMEOUT,
  )

  it(
    'Validate Payment transaction v2 API: Payment Transaction: Specify Only DeliverMax field',
    async () => {
      const payment_txn = payment_txn_example
      payment_txn.DeliverMax = payment_txn.Amount
      delete payment_txn.Amount

      const result = await testTransaction(
        testContext.client,
        payment_txn,
        payment_txn_wallet,
      )

      assert.equal(result.result.engine_result_code, 0)
      assert.equal((result.result.tx_json as Payment).Amount, amount_)
    },
    TIMEOUT,
  )

  it(
    'Validate Payment transaction v2 API: Payment Transaction: identical DeliverMax and Amount fields',
    async () => {
      const payment_txn = payment_txn_example
      payment_txn.DeliverMax = payment_txn.Amount

      const result = await testTransaction(
        testContext.client,
        payment_txn,
        payment_txn_wallet,
      )

      assert.equal(result.result.engine_result_code, 0)
      assert.equal((result.result.tx_json as Payment).Amount, amount_)
    },
    TIMEOUT,
  )

  it(
    'Validate Payment transaction v2 API: Payment Transaction: differing DeliverMax and Amount fields',
    async () => {
      const payment_txn = payment_txn_example
      // Different from the Amount field
      payment_txn.DeliverMax = '9999'

      try {
        await testTransaction(
          testContext.client,
          payment_txn,
          payment_txn_wallet,
        )
      } catch (err) {
        assert.equal(
          (err as ValidationError).message,
          'PaymentTransaction: Amount and DeliverMax fields must be identical when both are provided',
        )
      }
    },
    TIMEOUT,
  )
})
