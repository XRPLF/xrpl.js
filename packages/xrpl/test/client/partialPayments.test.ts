/* eslint-disable @typescript-eslint/no-explicit-any -- required for formatting transactions */
import { expect } from 'chai'
import cloneDeep from 'lodash/cloneDeep'

import type { TransactionStream } from '../../src'
import rippled from '../fixtures/rippled'
import {
  setupClient,
  teardownClient,
  type XrplTestContext,
} from '../setupClient'

const partialPaymentIOU = rippled.partial_payments.iou
const partialPaymentXRP = rippled.partial_payments.xrp

describe('client handling of tfPartialPayments', function () {
  let testContext: XrplTestContext

  beforeEach(async () => {
    testContext = await setupClient()
  })
  afterEach(async () => teardownClient(testContext))

  it('Tx with no tfPartialPayment', async function () {
    testContext.mockRippled!.addResponse('tx', rippled.tx.Payment)
    const resp = await testContext.client.request({ command: 'tx' })

    expect(resp.warnings).to.equal(undefined)
  })

  it('Tx with IOU tfPartialPayment', async function () {
    const mockResponse = { ...rippled.tx.Payment, result: partialPaymentIOU }
    testContext.mockRippled!.addResponse('tx', mockResponse)
    const resp = await testContext.client.request({ command: 'tx' })

    expect(resp.warnings).to.deep.equal([
      {
        id: 2001,
        message: 'This response contains a Partial Payment',
      },
    ])
  })

  it('Tx with XRP tfPartialPayment', async function () {
    const mockResponse = { ...rippled.tx.Payment, result: partialPaymentXRP }
    testContext.mockRippled!.addResponse('tx', mockResponse)
    const resp = await testContext.client.request({ command: 'tx' })

    expect(resp.warnings).to.deep.equal([
      {
        id: 2001,
        message: 'This response contains a Partial Payment',
      },
    ])
  })

  it('account_tx with no tfPartialPayment', async function () {
    testContext.mockRippled!.addResponse(
      'account_tx',
      rippled.account_tx.normal,
    )
    const resp = await testContext.client.request({ command: 'account_tx' })

    expect(resp.warnings).to.equal(undefined)
  })

  it('account_tx with IOU tfPartialPayment', async function () {
    const partial = {
      ...rippled.tx.Payment,
      result: partialPaymentIOU,
    }
    const mockResponse = rippled.account_tx.normal
    mockResponse.result.transactions.push({
      tx: partial.result,
      meta: partial.result.meta,
    } as any)

    testContext.mockRippled!.addResponse('account_tx', mockResponse)
    const resp = await testContext.client.request({
      command: 'account_tx',
      account: mockResponse.result.account,
    })

    expect(resp.warnings).to.deep.equal([
      {
        id: 2001,
        message: 'This response contains a Partial Payment',
      },
    ])
  })

  it('account_tx with XRP tfPartialPayment', async function () {
    // TODO: Create fixtues with partial payments instead of using ...
    const partial = { ...rippled.tx.Payment, result: partialPaymentXRP }
    const mockResponse = rippled.account_tx.normal
    mockResponse.result.transactions.push({
      tx: partial.result,
      meta: partial.result.meta,
    } as any)

    testContext.mockRippled!.addResponse('account_tx', mockResponse)
    const resp = await testContext.client.request({
      command: 'account_tx',
      account: mockResponse.result.account,
    })

    expect(resp.warnings).to.deep.equal([
      {
        id: 2001,
        message: 'This response contains a Partial Payment',
      },
    ])
  })

  it('transaction_entry with no tfPartialPayment', async function () {
    testContext.mockRippled!.addResponse(
      'transaction_entry',
      rippled.transaction_entry,
    )
    const resp = await testContext.client.request({
      command: 'transaction_entry',
    })

    expect(resp.warnings).to.equal(undefined)
  })

  it('transaction_entry with XRP tfPartialPayment', async function () {
    const mockResponse = cloneDeep(rippled.transaction_entry)
    mockResponse.result.tx_json.Amount = '1000'
    testContext.mockRippled!.addResponse('transaction_entry', mockResponse)
    const resp = await testContext.client.request({
      command: 'transaction_entry',
    })

    expect(resp.warnings).to.deep.equal([
      {
        id: 2001,
        message: 'This response contains a Partial Payment',
      },
    ])
  })

  it('Transactions stream with no tfPartialPayment', (done) => {
    testContext.mockRippled!.addResponse(
      'transaction_entry',
      rippled.transaction_entry,
    )
    testContext.client.on('transaction', (tx: TransactionStream) => {
      expect(tx.warnings).to.equal(undefined)
      done()
    })

    // @ts-expect-error Using private method for testing
    testContext.client.connection.onMessage(
      JSON.stringify(rippled.streams.transaction),
    )
  })

  it('Transactions stream with XRP tfPartialPayment', (done) => {
    testContext.mockRippled!.addResponse(
      'transaction_entry',
      rippled.transaction_entry,
    )
    testContext.client.on('transaction', (tx: TransactionStream) => {
      expect(tx.warnings).to.deep.equal([
        {
          id: 2001,
          message: 'This response contains a Partial Payment',
        },
      ])
      done()
    })

    // @ts-expect-error Using private method for testing
    testContext.client.connection.onMessage(
      JSON.stringify(rippled.streams.partialPaymentTransaction),
    )
  })
})
