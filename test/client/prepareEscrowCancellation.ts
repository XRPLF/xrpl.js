import requests from '../fixtures/requests'
import responses from '../fixtures/responses'
import rippled from '../fixtures/rippled'
import setupClient from '../setupClient'
import { assertResultMatch, addressTests } from '../testUtils'

const instructionsWithMaxLedgerVersionOffset = { maxLedgerVersionOffset: 100 }

describe('client.prepareEscrowCancellation', function () {
  beforeEach(setupClient.setup)
  afterEach(setupClient.teardown)

  addressTests.forEach(function (test) {
    describe(test.type, function () {
      it('prepareEscrowCancellation', async function () {
        this.mockRippled.addResponse('server_info', rippled.server_info.normal)
        this.mockRippled.addResponse('fee', rippled.fee)
        this.mockRippled.addResponse('ledger_current', rippled.ledger_current)
        this.mockRippled.addResponse(
          'account_info',
          rippled.account_info.normal,
        )
        const result = await this.client.prepareEscrowCancellation(
          test.address,
          requests.prepareEscrowCancellation.normal,
          instructionsWithMaxLedgerVersionOffset,
        )
        assertResultMatch(
          result,
          responses.prepareEscrowCancellation.normal,
          'prepare',
        )
      })

      it('prepareEscrowCancellation with memos', async function () {
        this.mockRippled.addResponse('server_info', rippled.server_info.normal)
        this.mockRippled.addResponse('fee', rippled.fee)
        this.mockRippled.addResponse('ledger_current', rippled.ledger_current)
        this.mockRippled.addResponse(
          'account_info',
          rippled.account_info.normal,
        )
        const result = await this.client.prepareEscrowCancellation(
          test.address,
          requests.prepareEscrowCancellation.memos,
        )
        assertResultMatch(
          result,
          responses.prepareEscrowCancellation.memos,
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
        const result = await this.client.prepareEscrowCancellation(
          test.address,
          requests.prepareEscrowCancellation.normal,
          localInstructions,
        )
        assertResultMatch(
          result,
          responses.prepareEscrowCancellation.ticket,
          'prepare',
        )
      })
    })
  })
})
