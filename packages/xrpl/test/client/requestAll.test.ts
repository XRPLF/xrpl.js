import { assert, expect } from 'chai'

import { classicAddressToXAddress, type Request } from '../../src'
import rippled from '../fixtures/rippled'
import {
  setupClient,
  teardownClient,
  type XrplTestContext,
} from '../setupClient'
import { assertRejects } from '../testUtils'

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

const ACCOUNT = 'r9cZA1mLK5R5Am25ArfXFmqgNwjZgnfk59'

/**
 * Builds an `account_tx` response page. The first page carries a marker so
 * that `requestAll` asks for a second page, the last page does not.
 *
 * @param includeMarker - Whether the page carries a pagination marker.
 * @param transactions - The transactions reported by the page.
 * @returns A mocked `account_tx` response.
 */
function accountTxPage(
  includeMarker: boolean,
  transactions?: unknown[],
): Record<string, unknown> {
  const normal = rippled.account_tx.normal.result
  return {
    type: 'response',
    status: 'success',
    result: {
      account: normal.account,
      ledger_index_max: normal.ledger_index_max,
      ledger_index_min: normal.ledger_index_min,
      limit: normal.limit,
      transactions: transactions ?? normal.transactions,
      ...(includeMarker ? { marker: normal.marker } : {}),
    },
  }
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
})

describe('client.requestAll request handling', function () {
  let testContext: XrplTestContext
  let capturedRequests: Array<Record<string, unknown>>

  beforeEach(async () => {
    testContext = await setupClient()
    capturedRequests = []
  })
  afterEach(async () => teardownClient(testContext))

  it('sends the configured api version with every page', async function () {
    testContext.mockRippled!.addResponse('account_tx', (request: Request) => {
      capturedRequests.push(request)
      return accountTxPage(!('marker' in request))
    })

    testContext.client.apiVersion = 2
    const allResponses = await testContext.client.requestAll({
      command: 'account_tx',
      account: ACCOUNT,
      limit: 20,
    })

    assert.equal(allResponses.length, 2)
    assert.equal(capturedRequests.length, 2)
    capturedRequests.forEach(function (request) {
      assert.equal(request.api_version, 2)
      assert.equal(request.account, ACCOUNT)
    })
  })

  it('keeps an explicitly requested api version', async function () {
    testContext.mockRippled!.addResponse('account_tx', (request: Request) => {
      capturedRequests.push(request)
      return accountTxPage(!('marker' in request))
    })

    testContext.client.apiVersion = 2
    await testContext.client.requestAll({
      command: 'account_tx',
      account: ACCOUNT,
      limit: 20,
      api_version: 1,
    })

    assert.equal(capturedRequests.length, 2)
    capturedRequests.forEach(function (request) {
      assert.equal(request.api_version, 1)
    })
  })

  it('converts untagged X-addresses on every page', async function () {
    testContext.mockRippled!.addResponse('account_tx', (request: Request) => {
      capturedRequests.push(request)
      return accountTxPage(!('marker' in request))
    })

    const xAddress = classicAddressToXAddress(ACCOUNT, false, false)
    await testContext.client.requestAll({
      command: 'account_tx',
      account: xAddress,
      limit: 20,
    })

    assert.equal(capturedRequests.length, 2)
    capturedRequests.forEach(function (request) {
      assert.equal(request.account, ACCOUNT)
    })
  })

  it('rejects tagged X-addresses before sending a request', async function () {
    testContext.mockRippled!.addResponse('account_tx', (request: Request) => {
      capturedRequests.push(request)
      return accountTxPage(!('marker' in request))
    })

    const taggedXAddress = classicAddressToXAddress(ACCOUNT, 1234, false)
    await assertRejects(
      testContext.client.requestAll({
        command: 'account_tx',
        account: taggedXAddress,
        limit: 20,
      }),
      Error,
      'This command does not support the use of a tag. Use an address without a tag.',
    )

    assert.equal(capturedRequests.length, 0)
  })

  it('adds partial payment warnings to the page responses', async function () {
    const partialPayment = {
      ...rippled.tx.Payment,
      result: rippled.partial_payments.iou,
    }
    const transactions = [
      {
        tx_json: partialPayment.result.tx_json,
        meta: partialPayment.result.meta,
        validated: true,
      },
    ]
    testContext.mockRippled!.addResponse(
      'account_tx',
      accountTxPage(false, transactions),
    )

    const allResponses = await testContext.client.requestAll({
      command: 'account_tx',
      account: ACCOUNT,
      limit: 20,
    })

    assert.equal(allResponses.length, 1)
    const warnings = (allResponses[0] as { warnings?: unknown }).warnings
    expect(warnings).to.deep.equal([
      {
        id: 2001,
        message: 'This response contains a Partial Payment',
      },
    ])
  })
})
