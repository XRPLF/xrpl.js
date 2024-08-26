import { assert } from 'chai'

import {
  AccountTxRequest,
  Payment,
  type TransactionMetadata,
} from '../../../src'
import serverUrl from '../serverUrl'
import {
  setupClient,
  teardownClient,
  type XrplIntegrationTestContext,
} from '../setup'

// how long before each test case times out
const TIMEOUT = 20000

describe('account_tx', function () {
  let testContext: XrplIntegrationTestContext

  beforeEach(async () => {
    testContext = await setupClient(serverUrl)
  })
  afterEach(async () => teardownClient(testContext))

  it(
    'base',
    async () => {
      const request: AccountTxRequest = {
        command: 'account_tx',
        account: testContext.wallet.classicAddress,
        ledger_index: 'validated',
      }
      const response = await testContext.client.request(request)
      const expected = {
        result: {
          account: testContext.wallet.classicAddress,
          limit: 400,
          transactions: [
            {
              tx_json: {
                Account: 'rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh',
                DeliverMax: '400000000',
                Destination: testContext.wallet.classicAddress,
                Fee: '12',
                Flags: 0,
                LastLedgerSequence: 1753,
                Sequence: 843,
                SigningPubKey:
                  '0330E7FC9D56BB25D6893BA3F317AE5BCF33B3291BD63DB32654A313222F7FD020',
                TransactionType: 'Payment',
                TxnSignature:
                  '30440220693D244BC13967E3DA67BDC974096784ED03DD4ACE6F36645E5176988452AFCF02200F8AB172432913899F27EC5523829AEDAD00CC2445690400E294EDF652A85945',
                date: 685747005,
                hash: '2E68BC15813B4A836FAC4D80E42E6FDA6410E99AB973937DEA5E6C2E9A116BAB',
                ledger_index: 1734,
              },
            },
          ],
        },
        type: 'response',
      }
      assert.equal(response.type, expected.type)
      assert.equal(response.result.account, expected.result.account)
      assert.equal(
        (response.result.transactions[0].meta as TransactionMetadata<Payment>)
          .TransactionResult,
        'tesSUCCESS',
      )
      assert.equal(
        typeof response.result.transactions[0].tx_json?.LastLedgerSequence,
        'number',
      )
      assert.equal(
        typeof response.result.transactions[0].tx_json?.Sequence,
        'number',
      )
      assert.equal(
        typeof response.result.transactions[0].tx_json?.SigningPubKey,
        'string',
      )
      assert.equal(
        typeof response.result.transactions[0].tx_json?.TxnSignature,
        'string',
      )
      assert.equal(
        typeof response.result.transactions[0].tx_json?.Fee,
        'string',
      )
      assert.equal(typeof response.result.transactions[0].hash, 'string')
      assert.equal(
        typeof response.result.transactions[0].tx_json?.ledger_index,
        'number',
      )

      const responseTx = response.result.transactions[0].tx_json as Payment
      const expectedTx = expected.result.transactions[0].tx_json
      assert.deepEqual(
        [
          responseTx.Flags,
          responseTx.TransactionType,
          responseTx.Account,
          // @ts-expect-error -- DeliverMax is a valid field on Payment response
          responseTx.DeliverMax,
          responseTx.Destination,
        ],
        [
          expectedTx.Flags,
          expectedTx.TransactionType,
          expectedTx.Account,
          expectedTx.DeliverMax,
          expectedTx.Destination,
        ],
      )
    },
    TIMEOUT,
  )

  it(
    'uses api_version 1',
    async () => {
      const request: AccountTxRequest = {
        command: 'account_tx',
        account: testContext.wallet.classicAddress,
        ledger_index: 'validated',
        api_version: 1,
      }
      const response = await testContext.client.request<AccountTxRequest, 1>(
        request,
      )
      const expected = {
        result: {
          account: testContext.wallet.classicAddress,
          limit: 400,
          transactions: [
            {
              tx: {
                Account: 'rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh',
                Amount: '400000000',
                Destination: testContext.wallet.classicAddress,
                Fee: '12',
                Flags: 0,
                LastLedgerSequence: 1753,
                Sequence: 843,
                SigningPubKey:
                  '0330E7FC9D56BB25D6893BA3F317AE5BCF33B3291BD63DB32654A313222F7FD020',
                TransactionType: 'Payment',
                TxnSignature:
                  '30440220693D244BC13967E3DA67BDC974096784ED03DD4ACE6F36645E5176988452AFCF02200F8AB172432913899F27EC5523829AEDAD00CC2445690400E294EDF652A85945',
                date: 685747005,
                hash: '2E68BC15813B4A836FAC4D80E42E6FDA6410E99AB973937DEA5E6C2E9A116BAB',
                ledger_index: 1734,
              },
            },
          ],
        },
        type: 'response',
      }
      assert.equal(response.type, expected.type)
      assert.equal(response.result.account, expected.result.account)
      assert.equal(
        (response.result.transactions[0].meta as TransactionMetadata<Payment>)
          .TransactionResult,
        'tesSUCCESS',
      )
      assert.equal(
        typeof response.result.transactions[0].tx?.LastLedgerSequence,
        'number',
      )
      assert.equal(
        typeof response.result.transactions[0].tx?.Sequence,
        'number',
      )
      assert.equal(
        typeof response.result.transactions[0].tx?.SigningPubKey,
        'string',
      )
      assert.equal(
        typeof response.result.transactions[0].tx?.TxnSignature,
        'string',
      )
      assert.equal(typeof response.result.transactions[0].tx?.Fee, 'string')
      assert.equal(typeof response.result.transactions[0].tx?.hash, 'string')
      assert.equal(
        typeof response.result.transactions[0].tx?.ledger_index,
        'number',
      )

      const responseTx = response.result.transactions[0].tx as Payment
      const expectedTx = expected.result.transactions[0].tx
      assert.deepEqual(
        [
          responseTx.Flags,
          responseTx.TransactionType,
          responseTx.Account,
          responseTx.Amount,
          responseTx.Destination,
        ],
        [
          expectedTx.Flags,
          expectedTx.TransactionType,
          expectedTx.Account,
          expectedTx.Amount,
          expectedTx.Destination,
        ],
      )
    },
    TIMEOUT,
  )
})
