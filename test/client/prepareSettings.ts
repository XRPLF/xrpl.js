import { assert } from 'chai'

import { FormattedSettings } from '../../src/common/types/objects'
import requests from '../fixtures/requests'
import responses from '../fixtures/responses'
import rippled from '../fixtures/rippled'
import setupClient from '../setupClient'
import { assertResultMatch, addressTests } from '../testUtils'

const instructionsWithMaxLedgerVersionOffset = { maxLedgerVersionOffset: 100 }

describe('client.prepareSettings', function () {
  beforeEach(setupClient.setup)
  afterEach(setupClient.teardown)

  addressTests.forEach(function (test) {
    describe(test.type, function () {
      it('simple test', async function () {
        this.mockRippled.addResponse('server_info', rippled.server_info.normal)
        this.mockRippled.addResponse('fee', rippled.fee)
        this.mockRippled.addResponse('ledger_current', rippled.ledger_current)
        this.mockRippled.addResponse(
          'account_info',
          rippled.account_info.normal,
        )
        const response = await this.client.prepareSettings(
          test.address,
          requests.prepareSettings.domain,
          instructionsWithMaxLedgerVersionOffset,
        )
        assertResultMatch(response, responses.prepareSettings.flags, 'prepare')
      })
      it('no maxLedgerVersion', async function () {
        this.mockRippled.addResponse('server_info', rippled.server_info.normal)
        this.mockRippled.addResponse('fee', rippled.fee)
        this.mockRippled.addResponse('ledger_current', rippled.ledger_current)
        this.mockRippled.addResponse(
          'account_info',
          rippled.account_info.normal,
        )
        const response = await this.client.prepareSettings(
          test.address,
          requests.prepareSettings.domain,
          {
            maxLedgerVersion: null as unknown as undefined,
          },
        )
        assertResultMatch(
          response,
          responses.prepareSettings.noMaxLedgerVersion,
          'prepare',
        )
      })
      it('no instructions', async function () {
        this.mockRippled.addResponse('server_info', rippled.server_info.normal)
        this.mockRippled.addResponse('fee', rippled.fee)
        this.mockRippled.addResponse('ledger_current', rippled.ledger_current)
        this.mockRippled.addResponse(
          'account_info',
          rippled.account_info.normal,
        )
        const response = await this.client.prepareSettings(
          test.address,
          requests.prepareSettings.domain,
        )
        assertResultMatch(
          response,
          responses.prepareSettings.noInstructions,
          'prepare',
        )
      })
      it('regularKey', async function () {
        this.mockRippled.addResponse('server_info', rippled.server_info.normal)
        this.mockRippled.addResponse('fee', rippled.fee)
        this.mockRippled.addResponse('ledger_current', rippled.ledger_current)
        this.mockRippled.addResponse(
          'account_info',
          rippled.account_info.normal,
        )
        const regularKey = { regularKey: 'rAR8rR8sUkBoCZFawhkWzY4Y5YoyuznwD' }
        const response = await this.client.prepareSettings(
          test.address,
          regularKey,
          instructionsWithMaxLedgerVersionOffset,
        )
        assertResultMatch(
          response,
          responses.prepareSettings.regularKey,
          'prepare',
        )
      })
      it('remove regularKey', async function () {
        this.mockRippled.addResponse('server_info', rippled.server_info.normal)
        this.mockRippled.addResponse('fee', rippled.fee)
        this.mockRippled.addResponse('ledger_current', rippled.ledger_current)
        this.mockRippled.addResponse(
          'account_info',
          rippled.account_info.normal,
        )
        const regularKey = { regularKey: null }
        const response = await this.client.prepareSettings(
          test.address,
          regularKey as unknown as FormattedSettings,
          instructionsWithMaxLedgerVersionOffset,
        )
        assertResultMatch(
          response,
          responses.prepareSettings.removeRegularKey,
          'prepare',
        )
      })
      it('flag set', async function () {
        this.mockRippled.addResponse('server_info', rippled.server_info.normal)
        this.mockRippled.addResponse('fee', rippled.fee)
        this.mockRippled.addResponse('ledger_current', rippled.ledger_current)
        this.mockRippled.addResponse(
          'account_info',
          rippled.account_info.normal,
        )
        const settings = { requireDestinationTag: true }
        const response = await this.client.prepareSettings(
          test.address,
          settings,
          instructionsWithMaxLedgerVersionOffset,
        )
        assertResultMatch(
          response,
          responses.prepareSettings.flagSet,
          'prepare',
        )
      })
      it('flag clear', async function () {
        this.mockRippled.addResponse('server_info', rippled.server_info.normal)
        this.mockRippled.addResponse('fee', rippled.fee)
        this.mockRippled.addResponse('ledger_current', rippled.ledger_current)
        this.mockRippled.addResponse(
          'account_info',
          rippled.account_info.normal,
        )
        const settings = { requireDestinationTag: false }
        const response = await this.client.prepareSettings(
          test.address,
          settings,
          instructionsWithMaxLedgerVersionOffset,
        )
        assertResultMatch(
          response,
          responses.prepareSettings.flagClear,
          'prepare',
        )
      })
      it('set depositAuth flag', async function () {
        this.mockRippled.addResponse('server_info', rippled.server_info.normal)
        this.mockRippled.addResponse('fee', rippled.fee)
        this.mockRippled.addResponse('ledger_current', rippled.ledger_current)
        this.mockRippled.addResponse(
          'account_info',
          rippled.account_info.normal,
        )
        const settings = { depositAuth: true }
        const response = await this.client.prepareSettings(
          test.address,
          settings,
          instructionsWithMaxLedgerVersionOffset,
        )
        assertResultMatch(
          response,
          responses.prepareSettings.flagSetDepositAuth,
          'prepare',
        )
      })
      it('clear depositAuth flag', async function () {
        this.mockRippled.addResponse('server_info', rippled.server_info.normal)
        this.mockRippled.addResponse('fee', rippled.fee)
        this.mockRippled.addResponse('ledger_current', rippled.ledger_current)
        this.mockRippled.addResponse(
          'account_info',
          rippled.account_info.normal,
        )
        const settings = { depositAuth: false }
        const response = await this.client.prepareSettings(
          test.address,
          settings,
          instructionsWithMaxLedgerVersionOffset,
        )
        assertResultMatch(
          response,
          responses.prepareSettings.flagClearDepositAuth,
          'prepare',
        )
      })
      it('integer field clear', async function () {
        this.mockRippled.addResponse('server_info', rippled.server_info.normal)
        this.mockRippled.addResponse('fee', rippled.fee)
        this.mockRippled.addResponse('ledger_current', rippled.ledger_current)
        this.mockRippled.addResponse(
          'account_info',
          rippled.account_info.normal,
        )
        const settings = { transferRate: null }
        const response = await this.client.prepareSettings(
          test.address,
          settings,
          instructionsWithMaxLedgerVersionOffset,
        )
        assert(response)
        assert.strictEqual(JSON.parse(response.txJSON).TransferRate, 0)
      })
      it('set transferRate', async function () {
        this.mockRippled.addResponse('server_info', rippled.server_info.normal)
        this.mockRippled.addResponse('fee', rippled.fee)
        this.mockRippled.addResponse('ledger_current', rippled.ledger_current)
        this.mockRippled.addResponse(
          'account_info',
          rippled.account_info.normal,
        )
        const settings = { transferRate: 1 }
        const response = await this.client.prepareSettings(
          test.address,
          settings,
          instructionsWithMaxLedgerVersionOffset,
        )
        assertResultMatch(
          response,
          responses.prepareSettings.setTransferRate,
          'prepare',
        )
      })
      it('set signers', async function () {
        this.mockRippled.addResponse('server_info', rippled.server_info.normal)
        this.mockRippled.addResponse('fee', rippled.fee)
        this.mockRippled.addResponse('ledger_current', rippled.ledger_current)
        this.mockRippled.addResponse(
          'account_info',
          rippled.account_info.normal,
        )
        const settings = requests.prepareSettings.signers.normal
        const response = await this.client.prepareSettings(
          test.address,
          settings,
          instructionsWithMaxLedgerVersionOffset,
        )
        assertResultMatch(
          response,
          responses.prepareSettings.signers,
          'prepare',
        )
      })
      // it("signers no threshold", async function () {
      //   this.mockRippled.addResponse("server_info", rippled.server_info.normal);
      //   this.mockRippled.addResponse("fee", rippled.fee);
      //   this.mockRippled.addResponse("ledger_current", rippled.ledger_current);
      //   this.mockRippled.addResponse(
      //     "account_info",
      //     rippled.account_info.normal
      //   );
      //   const settings = requests.prepareSettings.signers.noThreshold;
      //   try {
      //     const response = await this.client.prepareSettings(
      //       test.address,
      //       settings,
      //       instructionsWithMaxLedgerVersionOffset
      //     );
      //     throw new Error(
      //       `Expected method to reject. Prepared transaction: ${JSON.stringify(
      //         response
      //       )}`
      //     );
      //   } catch (err) {
      //     assert.strictEqual(
      //       err.message,
      //       'instance.settings.signers requires property "threshold"'
      //     );
      //     assert.strictEqual(err.name, "ValidationError");
      //   }
      // });
      it('signers no weights', async function () {
        this.mockRippled.addResponse('server_info', rippled.server_info.normal)
        this.mockRippled.addResponse('fee', rippled.fee)
        this.mockRippled.addResponse('ledger_current', rippled.ledger_current)
        this.mockRippled.addResponse(
          'account_info',
          rippled.account_info.normal,
        )
        const settings = requests.prepareSettings.signers.noWeights
        const localInstructions = {
          signersCount: 1,
          ...instructionsWithMaxLedgerVersionOffset,
        }
        const response = await this.client.prepareSettings(
          test.address,
          settings,
          localInstructions,
        )
        assertResultMatch(
          response,
          responses.prepareSettings.noWeights,
          'prepare',
        )
      })
      it('fee for multisign', async function () {
        this.mockRippled.addResponse('server_info', rippled.server_info.normal)
        this.mockRippled.addResponse('fee', rippled.fee)
        this.mockRippled.addResponse('ledger_current', rippled.ledger_current)
        this.mockRippled.addResponse(
          'account_info',
          rippled.account_info.normal,
        )
        const localInstructions = {
          signersCount: 4,
          ...instructionsWithMaxLedgerVersionOffset,
        }
        const response = await this.client.prepareSettings(
          test.address,
          requests.prepareSettings.domain,
          localInstructions,
        )
        assertResultMatch(
          response,
          responses.prepareSettings.flagsMultisign,
          'prepare',
        )
      })
      it('no signer list', async function () {
        this.mockRippled.addResponse('server_info', rippled.server_info.normal)
        this.mockRippled.addResponse('fee', rippled.fee)
        this.mockRippled.addResponse('ledger_current', rippled.ledger_current)
        this.mockRippled.addResponse(
          'account_info',
          rippled.account_info.normal,
        )
        const settings = requests.prepareSettings.noSignerEntries
        const localInstructions = {
          signersCount: 1,
          ...instructionsWithMaxLedgerVersionOffset,
        }
        const response = await this.client.prepareSettings(
          test.address,
          settings,
          localInstructions,
        )
        assertResultMatch(
          response,
          responses.prepareSettings.noSignerList,
          'prepare',
        )
      })
      // it("invalid", async function () {
      //   this.mockRippled.addResponse("server_info", rippled.server_info.normal);
      //   this.mockRippled.addResponse("fee", rippled.fee);
      //   this.mockRippled.addResponse("ledger_current", rippled.ledger_current);
      //   this.mockRippled.addResponse(
      //     "account_info",
      //     rippled.account_info.normal
      //   );
      //   // domain must be a string
      //   const settings = { ...requests.prepareSettings.domain, domain: 123 };
      //   const localInstructions = {
      //     signersCount: 4,
      //     ...instructionsWithMaxLedgerVersionOffset,
      //   };

      //   try {
      //     const response = await this.client.prepareSettings(
      //       test.address,
      //       settings,
      //       localInstructions
      //     );
      //     throw new Error(
      //       `Expected method to reject. Prepared transaction: ${JSON.stringify(
      //         response
      //       )}`
      //     );
      //   } catch (err) {
      //     assert.strictEqual(
      //       err.message,
      //       "instance.settings.domain is not of a type(s) string"
      //     );
      //     assert.strictEqual(err.name, "ValidationError");
      //   }
      // });
      it('offline', async function () {
        this.mockRippled.addResponse('server_info', rippled.server_info.normal)
        this.mockRippled.addResponse('fee', rippled.fee)
        this.mockRippled.addResponse('ledger_current', rippled.ledger_current)
        this.mockRippled.addResponse(
          'account_info',
          rippled.account_info.normal,
        )
        const secret = 'shsWGZcmZz6YsWWmcnpfr6fLTdtFV'

        const settings = requests.prepareSettings.domain
        const instructions = {
          sequence: 23,
          maxLedgerVersion: 8820051,
          fee: '0.000012',
        }
        const result = await this.client.prepareSettings(
          test.address,
          settings,
          instructions,
        )
        assertResultMatch(result, responses.prepareSettings.flags, 'prepare')
        assert.deepEqual(
          this.client.sign(result.txJSON, secret),
          responses.prepareSettings.signed,
        )
      })
      it('prepare settings with ticket', async function () {
        this.mockRippled.addResponse('server_info', rippled.server_info.normal)
        this.mockRippled.addResponse('fee', rippled.fee)
        this.mockRippled.addResponse('ledger_current', rippled.ledger_current)
        this.mockRippled.addResponse(
          'account_info',
          rippled.account_info.normal,
        )
        const instructions = {
          ticketSequence: 23,
          maxLedgerVersion: 8820051,
          fee: '0.000012',
        }
        const response = await this.client.prepareSettings(
          test.address,
          requests.prepareSettings.domain,
          instructions,
        )
        assertResultMatch(response, responses.prepareSettings.ticket, 'prepare')
      })
    })
  })
})
