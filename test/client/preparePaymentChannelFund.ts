import requests from '../fixtures/requests'
import responses from '../fixtures/responses'
import rippled from '../fixtures/rippled'
import { setupClient, teardownClient } from '../setupClient'
import { assertResultMatch, addressTests } from '../testUtils'

const instructionsWithMaxLedgerVersionOffset = { maxLedgerVersionOffset: 100 }

describe('client.preparePaymentChannelFund', function () {
  beforeEach(setupClient)
  afterEach(teardownClient)

  addressTests.forEach(function (test) {
    describe(test.type, function () {
      it('preparePaymentChannelFund', async function () {
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
        }
        const result = await this.client.preparePaymentChannelFund(
          test.address,
          requests.preparePaymentChannelFund.normal,
          localInstructions,
        )
        assertResultMatch(
          result,
          responses.preparePaymentChannelFund.normal,
          'prepare',
        )
      })

      it('preparePaymentChannelFund full', async function () {
        this.mockRippled.addResponse('server_info', rippled.server_info.normal)
        this.mockRippled.addResponse('fee', rippled.fee)
        this.mockRippled.addResponse('ledger_current', rippled.ledger_current)
        this.mockRippled.addResponse(
          'account_info',
          rippled.account_info.normal,
        )
        const result = await this.client.preparePaymentChannelFund(
          test.address,
          requests.preparePaymentChannelFund.full,
        )
        assertResultMatch(
          result,
          responses.preparePaymentChannelFund.full,
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
        const result = await this.client.preparePaymentChannelFund(
          test.address,
          requests.preparePaymentChannelFund.normal,
          localInstructions,
        )
        assertResultMatch(
          result,
          responses.preparePaymentChannelFund.ticket,
          'prepare',
        )
      })
    })
  })
})
