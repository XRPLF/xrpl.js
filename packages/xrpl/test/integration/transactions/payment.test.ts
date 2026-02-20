import { assert } from 'chai'

import {
  Payment,
  Wallet,
  MPTokenIssuanceCreate,
  MPTokenIssuanceCreateFlags,
  MPTokenAuthorize,
  AMMCreate,
  TransactionMetadata,
} from '../../../src'
import { createMPTIssuanceAndAuthorize } from '../mptUtils'
import serverUrl from '../serverUrl'
import {
  setupClient,
  teardownClient,
  type XrplIntegrationTestContext,
} from '../setup'
import {
  fetchAccountReserveFee,
  generateFundedWallet,
  testTransaction,
} from '../utils'

// how long before each test case times out
const TIMEOUT = 20000

describe('Payment', function () {
  let testContext: XrplIntegrationTestContext
  let paymentTx: Payment
  let amount: string
  const DEFAULT_AMOUNT = '10000000'
  // This wallet is used for DeliverMax related tests
  let senderWallet: Wallet

  beforeEach(async () => {
    // this payment transaction JSON needs to be refreshed before every test.
    // Because, we tinker with Amount and DeliverMax fields in the API v2 tests
    paymentTx = {
      TransactionType: 'Payment',
      Account: senderWallet.classicAddress,
      Amount: amount,
      Destination: 'rfkE1aSy9G8Upk4JssnwBxhEv5p4mn2KTy',
    }
  })

  beforeAll(async () => {
    testContext = await setupClient(serverUrl)
    senderWallet = await generateFundedWallet(testContext.client)
    // Make sure the amount sent satisfies minimum reserve requirement to fund an account.
    amount =
      (await fetchAccountReserveFee(testContext.client)) ?? DEFAULT_AMOUNT
  })
  afterAll(async () => teardownClient(testContext))

  it(
    'base',
    async () => {
      const tx: Payment = {
        TransactionType: 'Payment',
        Account: testContext.wallet.classicAddress,
        Destination: senderWallet.classicAddress,
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
        senderWallet,
      )

      assert.equal(result.result.engine_result_code, 0)
      assert.equal((result.result.tx_json as Payment).Amount, amount)
    },
    TIMEOUT,
  )

  it(
    'Validate Payment transaction API v2: Payment Transaction: Specify Only DeliverMax field',
    async () => {
      paymentTx.DeliverMax = paymentTx.Amount
      // @ts-expect-error -- DeliverMax is a non-protocol, RPC level field in Payment transactions
      delete paymentTx.Amount

      const result = await testTransaction(
        testContext.client,
        paymentTx,
        senderWallet,
      )

      assert.equal(result.result.engine_result_code, 0)
      assert.equal((result.result.tx_json as Payment).Amount, amount)
    },
    TIMEOUT,
  )

  it(
    'Validate Payment transaction API v2: Payment Transaction: identical DeliverMax and Amount fields',
    async () => {
      paymentTx.DeliverMax = paymentTx.Amount

      const result = await testTransaction(
        testContext.client,
        paymentTx,
        senderWallet,
      )

      assert.equal(result.result.engine_result_code, 0)
      assert.equal((result.result.tx_json as Payment).Amount, amount)
    },
    TIMEOUT,
  )

  it(
    'Validate MPT Payment ',
    async () => {
      const wallet2 = await generateFundedWallet(testContext.client)

      const createTx: MPTokenIssuanceCreate = {
        TransactionType: 'MPTokenIssuanceCreate',
        Account: testContext.wallet.classicAddress,
      }

      const mptCreateRes = await testTransaction(
        testContext.client,
        createTx,
        testContext.wallet,
      )

      const txHash = mptCreateRes.result.tx_json.hash

      const txResponse = await testContext.client.request({
        command: 'tx',
        transaction: txHash,
      })

      const meta = txResponse.result
        .meta as TransactionMetadata<MPTokenIssuanceCreate>

      const mptID = meta.mpt_issuance_id!

      let accountObjectsResponse = await testContext.client.request({
        command: 'account_objects',
        account: testContext.wallet.classicAddress,
        type: 'mpt_issuance',
      })
      assert.lengthOf(
        accountObjectsResponse.result.account_objects,
        1,
        'Should be exactly one issuance on the ledger',
      )

      const authTx: MPTokenAuthorize = {
        TransactionType: 'MPTokenAuthorize',
        Account: wallet2.classicAddress,
        MPTokenIssuanceID: mptID,
      }

      await testTransaction(testContext.client, authTx, wallet2)

      accountObjectsResponse = await testContext.client.request({
        command: 'account_objects',
        account: wallet2.classicAddress,
        type: 'mptoken',
      })

      assert.lengthOf(
        accountObjectsResponse.result.account_objects,
        1,
        'Holder owns 1 MPToken on the ledger',
      )

      const payTx: Payment = {
        TransactionType: 'Payment',
        Account: testContext.wallet.classicAddress,
        Destination: wallet2.classicAddress,
        Amount: {
          mpt_issuance_id: mptID,
          value: '100',
        },
      }

      await testTransaction(testContext.client, payTx, testContext.wallet)

      accountObjectsResponse = await testContext.client.request({
        command: 'account_objects',
        account: testContext.wallet.classicAddress,
        type: 'mpt_issuance',
      })
      assert.equal(
        // @ts-expect-error -- Object type not known
        accountObjectsResponse.result.account_objects[0].OutstandingAmount,
        `100`,
      )
    },
    TIMEOUT,
  )

  it(
    'Payment with MPT PathSet',
    async () => {
      const issuer1 = await generateFundedWallet(testContext.client)
      const issuer2 = await generateFundedWallet(testContext.client)
      const lpWallet = await generateFundedWallet(testContext.client)
      const destination = await generateFundedWallet(testContext.client)

      const mptFlags =
        MPTokenIssuanceCreateFlags.tfMPTCanTrade |
        MPTokenIssuanceCreateFlags.tfMPTCanTransfer

      // Create MPT_A (issuer1) and authorize + fund LP
      const mptIdA = await createMPTIssuanceAndAuthorize(
        testContext.client,
        issuer1,
        lpWallet,
        mptFlags,
        '10000',
      )

      // Create MPT_B (issuer2) and authorize + fund LP
      const mptIdB = await createMPTIssuanceAndAuthorize(
        testContext.client,
        issuer2,
        lpWallet,
        mptFlags,
        '10000',
      )

      // Authorize destination to hold MPT_B
      const authTx: MPTokenAuthorize = {
        TransactionType: 'MPTokenAuthorize',
        Account: destination.classicAddress,
        MPTokenIssuanceID: mptIdB,
      }
      await testTransaction(testContext.client, authTx, destination)

      // Create AMM pool: XRP / MPT_A
      const ammCreate1: AMMCreate = {
        TransactionType: 'AMMCreate',
        Account: lpWallet.classicAddress,
        Amount: '1000000',
        Amount2: {
          mpt_issuance_id: mptIdA,
          value: '1000',
        },
        TradingFee: 12,
      }
      await testTransaction(testContext.client, ammCreate1, lpWallet)

      // Create AMM pool: MPT_A / MPT_B
      const ammCreate2: AMMCreate = {
        TransactionType: 'AMMCreate',
        Account: lpWallet.classicAddress,
        Amount: {
          mpt_issuance_id: mptIdA,
          value: '1000',
        },
        Amount2: {
          mpt_issuance_id: mptIdB,
          value: '1000',
        },
        TradingFee: 12,
      }
      await testTransaction(testContext.client, ammCreate2, lpWallet)

      // Create AMM pool: XRP / MPT_B
      const ammCreate3: AMMCreate = {
        TransactionType: 'AMMCreate',
        Account: lpWallet.classicAddress,
        Amount: '1000000',
        Amount2: {
          mpt_issuance_id: mptIdB,
          value: '1000',
        },
        TradingFee: 12,
      }
      await testTransaction(testContext.client, ammCreate3, lpWallet)

      // Cross-currency payment: XRP → MPT_B with two alternative paths
      // Path 1: XRP → MPT_A → MPT_B (via XRP/MPT_A and MPT_A/MPT_B pools)
      // Path 2: XRP → MPT_B (via XRP/MPT_B pool)
      const payTx: Payment = {
        TransactionType: 'Payment',
        Account: testContext.wallet.classicAddress,
        Destination: destination.classicAddress,
        Amount: {
          mpt_issuance_id: mptIdB,
          value: '5',
        },
        SendMax: '500000',
        Paths: [[{ mpt_issuance_id: mptIdA }], [{ mpt_issuance_id: mptIdB }]],
      }

      await testTransaction(testContext.client, payTx, testContext.wallet)
    },
    60000,
  )
})
