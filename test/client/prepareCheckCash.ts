import requests from '../fixtures/requests'
import responses from '../fixtures/responses'
import rippled from '../fixtures/rippled'
import { setupClient, teardownClient } from '../setupClient'
import { assertResultMatch, addressTests } from '../testUtils'

const instructionsWithMaxLedgerVersionOffset = { maxLedgerVersionOffset: 100 }

describe('client.prepareCheckCash', function () {
  beforeEach(setupClient)
  afterEach(teardownClient)

  addressTests.forEach(function (test) {
    describe(test.type, function () {
      it('prepareCheckCash amount', async function () {
        this.mockRippled.addResponse('server_info', rippled.server_info.normal)
        this.mockRippled.addResponse('fee', rippled.fee)
        this.mockRippled.addResponse('ledger_current', rippled.ledger_current)
        this.mockRippled.addResponse(
          'account_info',
          rippled.account_info.normal,
        )
        const result = await this.client.prepareCheckCash(
          test.address,
          requests.prepareCheckCash.amount,
        )
        assertResultMatch(result, responses.prepareCheckCash.amount, 'prepare')
      })

      it('prepareCheckCash deliverMin', async function () {
        this.mockRippled.addResponse('server_info', rippled.server_info.normal)
        this.mockRippled.addResponse('fee', rippled.fee)
        this.mockRippled.addResponse('ledger_current', rippled.ledger_current)
        this.mockRippled.addResponse(
          'account_info',
          rippled.account_info.normal,
        )
        const result = await this.client.prepareCheckCash(
          test.address,
          requests.prepareCheckCash.deliverMin,
        )
        assertResultMatch(
          result,
          responses.prepareCheckCash.deliverMin,
          'prepare',
        )
      })

      it('with ticket', async function () {
        this.mockRippled.addResponse('server_info', rippled.server_info.normal)
        this.mockRippled.addResponse('fee', rippled.fee)
        this.mockRippled.addResponse('ledger_current', rippled.ledger_current)
        this.mockRippled.addResponse(
          'account_info',
          rippled.account_info.normal,
        )
        const localInstructions = {
          ...instructionsWithMaxLedgerVersionOffset,
          maxFee: '0.000012',
          ticketSequence: 23,
        }
        const result = await this.client.prepareCheckCash(
          test.address,
          requests.prepareCheckCash.amount,
          localInstructions,
        )
        assertResultMatch(result, responses.prepareCheckCash.ticket, 'prepare')
      })
    })
  })
})
