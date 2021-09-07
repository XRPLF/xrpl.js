import { assert } from 'chai'

import requests from '../fixtures/requests'
import responses from '../fixtures/responses'
import rippled from '../fixtures/rippled'
import { setupClient, teardownClient } from '../setupClient'
import { assertResultMatch, addressTests } from '../testUtils'

const instructionsWithMaxLedgerVersionOffset = { maxLedgerVersionOffset: 100 }
const { preparePaymentChannelClaim: REQUEST_FIXTURES } = requests
const { preparePaymentChannelClaim: RESPONSE_FIXTURES } = responses

describe('client.preparePaymentChannelClaim', function () {
  beforeEach(setupClient)
  afterEach(teardownClient)

  addressTests.forEach(function (test) {
    describe(test.type, function () {
      it('default', async function () {
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
        const response = await this.client.preparePaymentChannelClaim(
          test.address,
          REQUEST_FIXTURES.normal,
          localInstructions,
        )
        assertResultMatch(response, RESPONSE_FIXTURES.normal, 'prepare')
      })

      it('with renew', async function () {
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
        const response = await this.client.preparePaymentChannelClaim(
          test.address,
          REQUEST_FIXTURES.renew,
          localInstructions,
        )
        assertResultMatch(response, RESPONSE_FIXTURES.renew, 'prepare')
      })

      it('with close', async function () {
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
        const response = await this.client.preparePaymentChannelClaim(
          test.address,
          REQUEST_FIXTURES.close,
          localInstructions,
        )
        assertResultMatch(response, RESPONSE_FIXTURES.close, 'prepare')
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
        const response = await this.client.preparePaymentChannelClaim(
          test.address,
          REQUEST_FIXTURES.normal,
          localInstructions,
        )
        assertResultMatch(response, RESPONSE_FIXTURES.ticket, 'prepare')
      })

      it('rejects Promise on preparePaymentChannelClaim with renew and close', async function () {
        this.mockRippled.addResponse('server_info', rippled.server_info.normal)
        this.mockRippled.addResponse('fee', rippled.fee)
        this.mockRippled.addResponse('ledger_current', rippled.ledger_current)
        this.mockRippled.addResponse(
          'account_info',
          rippled.account_info.normal,
        )
        try {
          const prepared = await this.client.preparePaymentChannelClaim(
            test.address,
            REQUEST_FIXTURES.full,
          )
          throw new Error(
            `Expected method to reject. Prepared transaction: ${JSON.stringify(
              prepared,
            )}`,
          )
        } catch (err) {
          assert.strictEqual(err.name, 'ValidationError')
          assert.strictEqual(
            err.message,
            '"renew" and "close" flags on PaymentChannelClaim are mutually exclusive',
          )
        }
      })

      it('rejects Promise on preparePaymentChannelClaim with no signature', async function () {
        this.mockRippled.addResponse('server_info', rippled.server_info.normal)
        this.mockRippled.addResponse('fee', rippled.fee)
        this.mockRippled.addResponse('ledger_current', rippled.ledger_current)
        this.mockRippled.addResponse(
          'account_info',
          rippled.account_info.normal,
        )
        try {
          const prepared = await this.client.preparePaymentChannelClaim(
            test.address,
            REQUEST_FIXTURES.noSignature,
          )
          throw new Error(
            `Expected method to reject. Prepared transaction: ${JSON.stringify(
              prepared,
            )}`,
          )
        } catch (err) {
          assert.strictEqual(err.name, 'ValidationError')
          assert.strictEqual(
            err.message,
            '"signature" and "publicKey" fields on PaymentChannelClaim must only be specified together.',
          )
        }
      })
    })
  })
})
