import { assert } from 'chai'
import cloneDeep from 'lodash/cloneDeep'

import type { Request } from '../../src'
import addresses from '../fixtures/addresses.json'
import rippled from '../fixtures/rippled'
import {
  setupClient,
  teardownClient,
  type XrplTestContext,
} from '../setupClient'

const rippledResponse = function (request: Request): Record<string, unknown> {
  if ('marker' in request) {
    return rippled.ledger_data.lastPage
  }
  return rippled.ledger_data.firstPage
}

const rippledResponseFirstEmpty = function (
  request: Request,
): Record<string, unknown> {
  if ('marker' in request) {
    return rippled.ledger_data.lastPage
  }
  return rippled.ledger_data.firstPageEmpty
}

const PARTIAL_PAYMENT_WARNING = {
  id: 2001,
  message: 'This response contains a Partial Payment',
}

describe('client.requestAll', function () {
  let testContext: XrplTestContext

  beforeEach(async () => {
    testContext = await setupClient()
  })
  afterEach(async () => teardownClient(testContext))
  it('requests the next page', async function () {
    testContext.mockRippled!.addResponse('ledger_data', rippledResponse)
    const allResponses = await testContext.client.requestAll({
      command: 'ledger_data',
    })
    assert.equal(allResponses.length, 2)
    assert.equal(
      allResponses[1].result.state[0].index,
      '000B714B790C3C79FEE00D17C4DEB436B375466F29679447BA64F265FD63D731',
    )
  })

  it('stops when there are no more pages', async function () {
    testContext.mockRippled!.addResponse(
      'ledger_data',
      rippled.ledger_data.lastPage,
    )
    const allResponses = await testContext.client.requestAll({
      command: 'ledger_data',
    })
    assert.equal(allResponses.length, 1)
  })

  it('handles when the first page has no results', async function () {
    testContext.mockRippled!.addResponse(
      'ledger_data',
      rippledResponseFirstEmpty,
    )
    const allResponses = await testContext.client.requestAll({
      command: 'ledger_data',
    })
    assert.equal(allResponses.length, 2)
  })

  it('applies the configured api_version to every page', async function () {
    const sentRequests: Request[] = []
    const firstPage = cloneDeep(rippled.account_tx.normal)
    const lastPage = cloneDeep(rippled.account_tx.normal)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- remove the marker so pagination stops
    delete (lastPage.result as any).marker
    testContext.mockRippled!.addResponse('account_tx', (request: Request) => {
      sentRequests.push(request)
      return 'marker' in request ? lastPage : firstPage
    })
    testContext.client.apiVersion = 2

    const allResponses = await testContext.client.requestAll({
      command: 'account_tx',
      account: addresses.ACCOUNT,
    })

    assert.equal(allResponses.length, 2)
    assert.equal(sentRequests.length, 2)
    sentRequests.forEach((request) => {
      assert.equal(request.api_version, 2)
    })
  })

  it('keeps an explicit api_version instead of the configured one', async function () {
    const sentRequests: Request[] = []
    const firstPage = cloneDeep(rippled.account_tx.normal)
    const lastPage = cloneDeep(rippled.account_tx.normal)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- remove the marker so pagination stops
    delete (lastPage.result as any).marker
    testContext.mockRippled!.addResponse('account_tx', (request: Request) => {
      sentRequests.push(request)
      return 'marker' in request ? lastPage : firstPage
    })
    testContext.client.apiVersion = 2

    const allResponses = await testContext.client.requestAll({
      command: 'account_tx',
      account: addresses.ACCOUNT,
      api_version: 1,
    })

    assert.equal(allResponses.length, 2)
    assert.equal(sentRequests.length, 2)
    sentRequests.forEach((request) => {
      assert.equal(request.api_version, 1)
    })
  })

  it('converts an untagged X-Address to a classic address on every page', async function () {
    const sentRequests: Request[] = []
    const firstPage = cloneDeep(rippled.account_tx.normal)
    const lastPage = cloneDeep(rippled.account_tx.normal)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- remove the marker so pagination stops
    delete (lastPage.result as any).marker
    testContext.mockRippled!.addResponse('account_tx', (request: Request) => {
      sentRequests.push(request)
      return 'marker' in request ? lastPage : firstPage
    })

    const allResponses = await testContext.client.requestAll({
      command: 'account_tx',
      account: addresses.ACCOUNT_X,
    })

    assert.equal(allResponses.length, 2)
    assert.equal(sentRequests.length, 2)
    sentRequests.forEach((request) => {
      assert.equal(request.account, addresses.ACCOUNT)
    })
  })

  it('rejects a tagged X-Address before sending any request', async function () {
    const sentRequests: Request[] = []
    testContext.mockRippled!.addResponse('account_tx', (request: Request) => {
      sentRequests.push(request)
      return rippled.account_tx.normal
    })

    // addresses.ACCOUNT with destination tag 12345 (ACCOUNT_T is untagged)
    const taggedAddress = 'X7AcgcsBL6XDcUb289X4mJ8djcdyKaHcqA3bkjhpzdaYpQr'
    let error: unknown
    try {
      await testContext.client.requestAll({
        command: 'account_tx',
        account: taggedAddress,
      })
    } catch (err) {
      error = err
    }

    assert.instanceOf(error, Error)
    assert.match(error.message, /tag/u)
    assert.equal(sentRequests.length, 0)
  })

  it('adds partial-payment warnings to pages with a partial payment', async function () {
    const partial = rippled.partial_payments.xrp
    const firstPage = cloneDeep(rippled.account_tx.normal)
    firstPage.result.transactions.push({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- we are mocking the response
      tx_json: partial.tx_json as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- we are mocking the response
      meta: partial.meta as any,
      validated: true,
    })
    const lastPage = cloneDeep(rippled.account_tx.normal)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- remove the marker so pagination stops
    delete (lastPage.result as any).marker
    testContext.mockRippled!.addResponse('account_tx', (request: Request) => {
      return 'marker' in request ? lastPage : firstPage
    })

    const allResponses = await testContext.client.requestAll({
      command: 'account_tx',
      account: addresses.ACCOUNT,
    })

    assert.equal(allResponses.length, 2)
    assert.deepEqual(allResponses[0].warnings, [PARTIAL_PAYMENT_WARNING])
    assert.equal(allResponses[1].warnings, undefined)
  })
})
