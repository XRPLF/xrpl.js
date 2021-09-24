/* eslint-disable @typescript-eslint/no-explicit-any -- required for formatting transactions */
import { expect } from 'chai'

import type { TransactionStream } from '../../src'
import rippled from '../fixtures/rippled'
import { setupClient, teardownClient } from '../setupClient'

const partialPaymentIOU = rippled.partial_payments.iou
const partialPaymentXRP = rippled.partial_payments.xrp

describe('client handling of tfPartialPayments', function () {
  beforeEach(setupClient)
  afterEach(teardownClient)

  it('Tx with no tfPartialPayment', async function () {
    this.mockRippled.addResponse('tx', rippled.tx.Payment)
    const resp = await this.client.request({ command: 'tx' })

    expect(resp.warnings).to.equal(undefined)
  })

  it('Tx with IOU tfPartialPayment', async function () {
    const mockResponse = { ...rippled.tx.Payment, result: partialPaymentIOU }
    this.mockRippled.addResponse('tx', mockResponse)
    const resp = await this.client.request({ command: 'tx' })

    expect(resp.warnings).to.deep.equal([
      {
        id: 2001,
        message: 'This response contains a Partial Payment',
      },
    ])
  })

  it('Tx with XRP tfPartialPayment', async function () {
    const mockResponse = { ...rippled.tx.Payment, result: partialPaymentXRP }
    this.mockRippled.addResponse('tx', mockResponse)
    const resp = await this.client.request({ command: 'tx' })

    expect(resp.warnings).to.deep.equal([
      {
        id: 2001,
        message: 'This response contains a Partial Payment',
      },
    ])
  })

  it('account_tx with no tfPartialPayment', async function () {
    this.mockRippled.addResponse('account_tx', rippled.account_tx.normal)
    const resp = await this.client.request({ command: 'account_tx' })

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

    this.mockRippled.addResponse('account_tx', mockResponse)
    const resp = await this.client.request({
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

    this.mockRippled.addResponse('account_tx', mockResponse)
    const resp = await this.client.request({
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
    this.mockRippled.addResponse('transaction_entry', rippled.transaction_entry)
    const resp = await this.client.request({ command: 'transaction_entry' })

    expect(resp.warnings).to.equal(undefined)
  })

  it('transaction_entry with XRP tfPartialPayment', async function () {
    const mockResponse = rippled.transaction_entry
    mockResponse.result.tx_json.Amount = '1000'
    this.mockRippled.addResponse('transaction_entry', rippled.transaction_entry)
    const resp = await this.client.request({ command: 'transaction_entry' })

    expect(resp.warnings).to.deep.equal([
      {
        id: 2001,
        message: 'This response contains a Partial Payment',
      },
    ])
  })

  it('Transactions stream with no tfPartialPayment', async function (done) {
    this.mockRippled.addResponse('transaction_entry', rippled.transaction_entry)
    this.client.on('transaction', (tx: TransactionStream) => {
      expect(tx.warnings).to.equal(undefined)
      done()
    })

    this.client.connection.onMessage(
      JSON.stringify(rippled.streams.transaction),
    )
  })

  it('Transactions stream with XRP tfPartialPayment', async function (done) {
    this.mockRippled.addResponse('transaction_entry', rippled.transaction_entry)
    this.client.on('transaction', (tx: TransactionStream) => {
      expect(tx.warnings).to.deep.equal([
        {
          id: 2001,
          message: 'This response contains a Partial Payment',
        },
      ])
      done()
    })

    const partial: any = rippled.streams.transaction
    partial.transaction = rippled.tx.Payment.result
    partial.meta.delivered_amount = '1000'
    partial.transaction.Flags = 0x00020000
    this.client.connection.onMessage(JSON.stringify(partial))
  })
})
