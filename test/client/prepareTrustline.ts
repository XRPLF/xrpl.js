import requests from '../fixtures/requests'
import responses from '../fixtures/responses'
import rippled from '../fixtures/rippled'
import { setupClient, teardownClient } from '../setupClient'
import { assertResultMatch, addressTests } from '../testUtils'

const instructionsWithMaxLedgerVersionOffset = { maxLedgerVersionOffset: 100 }

describe('client.prepareTrustline', function () {
  beforeEach(setupClient)
  afterEach(teardownClient)

  addressTests.forEach(function (test) {
    describe(test.type, function () {
      it('simple', async function () {
        this.mockRippled.addResponse('server_info', rippled.server_info.normal)
        this.mockRippled.addResponse('fee', rippled.fee)
        this.mockRippled.addResponse('ledger_current', rippled.ledger_current)
        this.mockRippled.addResponse(
          'account_info',
          rippled.account_info.normal,
        )
        const result = await this.client.prepareTrustline(
          test.address,
          requests.prepareTrustline.simple,
          instructionsWithMaxLedgerVersionOffset,
        )
        assertResultMatch(result, responses.prepareTrustline.simple, 'prepare')
      })

      it('frozen', async function () {
        this.mockRippled.addResponse('server_info', rippled.server_info.normal)
        this.mockRippled.addResponse('fee', rippled.fee)
        this.mockRippled.addResponse('ledger_current', rippled.ledger_current)
        this.mockRippled.addResponse(
          'account_info',
          rippled.account_info.normal,
        )
        const result = await this.client.prepareTrustline(
          test.address,
          requests.prepareTrustline.frozen,
        )
        assertResultMatch(result, responses.prepareTrustline.frozen, 'prepare')
      })

      it('complex', async function () {
        this.mockRippled.addResponse('server_info', rippled.server_info.normal)
        this.mockRippled.addResponse('fee', rippled.fee)
        this.mockRippled.addResponse('ledger_current', rippled.ledger_current)
        this.mockRippled.addResponse(
          'account_info',
          rippled.account_info.normal,
        )
        const result = await this.client.prepareTrustline(
          test.address,
          requests.prepareTrustline.complex,
          instructionsWithMaxLedgerVersionOffset,
        )
        assertResultMatch(result, responses.prepareTrustline.complex, 'prepare')
      })

      // it("invalid", async function () {
      //   this.mockRippled.addResponse("server_info", rippled.server_info.normal);
      //   this.mockRippled.addResponse("fee", rippled.fee);
      //   this.mockRippled.addResponse("ledger_current", rippled.ledger_current);
      //   this.mockRippled.addResponse(
      //     "account_info",
      //     rippled.account_info.normal
      //   );
      //   const trustline = { ...requests.prepareTrustline.complex };
      //   delete trustline.limit; // Make invalid

      //   await assertRejects(
      //     this.client.prepareTrustline(
      //       test.address,
      //       trustline,
      //       instructionsWithMaxLedgerVersionOffset
      //     ),
      //     this.client.errors.ValidationError,
      //     'instance.trustline requires property "limit"'
      //   );
      // });

      it('xtest.address-issuer', async function () {
        this.mockRippled.addResponse('server_info', rippled.server_info.normal)
        this.mockRippled.addResponse('fee', rippled.fee)
        this.mockRippled.addResponse('ledger_current', rippled.ledger_current)
        this.mockRippled.addResponse(
          'account_info',
          rippled.account_info.normal,
        )
        const result = await this.client.prepareTrustline(
          test.address,
          requests.prepareTrustline.issuedXAddress,
          instructionsWithMaxLedgerVersionOffset,
        )
        assertResultMatch(
          result,
          responses.prepareTrustline.issuedXAddress,
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
        const result = await this.client.prepareTrustline(
          test.address,
          requests.prepareTrustline.simple,
          localInstructions,
        )
        assertResultMatch(result, responses.prepareTrustline.ticket, 'prepare')
      })
    })
  })
})
