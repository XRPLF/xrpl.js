import { ValidationError } from 'xrpl-local/common/errors'

import requests from '../fixtures/requests'
import responses from '../fixtures/responses'
import rippled from '../fixtures/rippled'
import { setupClient, teardownClient } from '../setupClient'
import { assertResultMatch, addressTests, assertRejects } from '../testUtils'

const instructionsWithMaxLedgerVersionOffset = { maxLedgerVersionOffset: 100 }
const { preparePayment: REQUEST_FIXTURES } = requests
const { preparePayment: RESPONSE_FIXTURES } = responses
const RECIPIENT_ADDRESS = 'rpZc4mVfWUif9CRoHRKKcmhu1nx2xktxBo'

describe('client.preparePayment', function () {
  beforeEach(setupClient)
  afterEach(teardownClient)

  addressTests.forEach(function (test) {
    describe(test.type, function () {
      it('normal', async function () {
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
        const response = await this.client.preparePayment(
          test.address,
          REQUEST_FIXTURES.normal,
          localInstructions,
        )
        assertResultMatch(response, RESPONSE_FIXTURES.normal, 'prepare')
      })

      it('min amount xrp', async function () {
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
        const response = await this.client.preparePayment(
          test.address,
          REQUEST_FIXTURES.minAmountXRP,
          localInstructions,
        )
        assertResultMatch(response, RESPONSE_FIXTURES.minAmountXRP, 'prepare')
      })

      it('min amount xrp2xrp', async function () {
        this.mockRippled.addResponse('server_info', rippled.server_info.normal)
        this.mockRippled.addResponse('fee', rippled.fee)
        this.mockRippled.addResponse('ledger_current', rippled.ledger_current)
        this.mockRippled.addResponse(
          'account_info',
          rippled.account_info.normal,
        )
        const response = await this.client.preparePayment(
          test.address,
          REQUEST_FIXTURES.minAmount,
          instructionsWithMaxLedgerVersionOffset,
        )
        assertResultMatch(
          response,
          RESPONSE_FIXTURES.minAmountXRPXRP,
          'prepare',
        )
      })

      it('XRP to XRP', async function () {
        this.mockRippled.addResponse('server_info', rippled.server_info.normal)
        this.mockRippled.addResponse('fee', rippled.fee)
        this.mockRippled.addResponse('ledger_current', rippled.ledger_current)
        this.mockRippled.addResponse(
          'account_info',
          rippled.account_info.normal,
        )
        const payment = {
          source: {
            address: 'r9cZA1mLK5R5Am25ArfXFmqgNwjZgnfk59',
            maxAmount: { value: '1', currency: 'XRP' },
          },
          destination: {
            address: 'rpZc4mVfWUif9CRoHRKKcmhu1nx2xktxBo',
            amount: { value: '1', currency: 'XRP' },
          },
        }
        const expected = {
          txJSON:
            '{"TransactionType":"Payment","Account":"r9cZA1mLK5R5Am25ArfXFmqgNwjZgnfk59","Destination":"rpZc4mVfWUif9CRoHRKKcmhu1nx2xktxBo","Amount":"1000000","Flags":2147483648,"LastLedgerSequence":8820051,"Sequence":23,"Fee":"12"}',
          instructions: {
            fee: '0.000012',
            sequence: 23,
            maxLedgerVersion: 8820051,
          },
        }
        const response = await this.client.preparePayment(
          test.address,
          payment,
          instructionsWithMaxLedgerVersionOffset,
        )
        assertResultMatch(response, expected, 'prepare')
      })

      it('XRP drops to XRP drops', async function () {
        this.mockRippled.addResponse('server_info', rippled.server_info.normal)
        this.mockRippled.addResponse('fee', rippled.fee)
        this.mockRippled.addResponse('ledger_current', rippled.ledger_current)
        this.mockRippled.addResponse(
          'account_info',
          rippled.account_info.normal,
        )
        const payment = {
          source: {
            address: 'r9cZA1mLK5R5Am25ArfXFmqgNwjZgnfk59',
            maxAmount: { value: '1000000', currency: 'drops' },
          },
          destination: {
            address: 'rpZc4mVfWUif9CRoHRKKcmhu1nx2xktxBo',
            amount: { value: '1000000', currency: 'drops' },
          },
        }
        const expected = {
          txJSON:
            '{"TransactionType":"Payment","Account":"r9cZA1mLK5R5Am25ArfXFmqgNwjZgnfk59","Destination":"rpZc4mVfWUif9CRoHRKKcmhu1nx2xktxBo","Amount":"1000000","Flags":2147483648,"LastLedgerSequence":8820051,"Sequence":23,"Fee":"12"}',
          instructions: {
            fee: '0.000012',
            sequence: 23,
            maxLedgerVersion: 8820051,
          },
        }
        const response = await this.client.preparePayment(
          test.address,
          payment,
          instructionsWithMaxLedgerVersionOffset,
        )
        assertResultMatch(response, expected, 'prepare')
      })

      it('XRP drops to XRP', async function () {
        this.mockRippled.addResponse('server_info', rippled.server_info.normal)
        this.mockRippled.addResponse('fee', rippled.fee)
        this.mockRippled.addResponse('ledger_current', rippled.ledger_current)
        this.mockRippled.addResponse(
          'account_info',
          rippled.account_info.normal,
        )
        const payment = {
          source: {
            address: 'r9cZA1mLK5R5Am25ArfXFmqgNwjZgnfk59',
            maxAmount: { value: '1000000', currency: 'drops' },
          },
          destination: {
            address: 'rpZc4mVfWUif9CRoHRKKcmhu1nx2xktxBo',
            amount: { value: '1', currency: 'XRP' },
          },
        }
        const expected = {
          txJSON:
            '{"TransactionType":"Payment","Account":"r9cZA1mLK5R5Am25ArfXFmqgNwjZgnfk59","Destination":"rpZc4mVfWUif9CRoHRKKcmhu1nx2xktxBo","Amount":"1000000","Flags":2147483648,"LastLedgerSequence":8820051,"Sequence":23,"Fee":"12"}',
          instructions: {
            fee: '0.000012',
            sequence: 23,
            maxLedgerVersion: 8820051,
          },
        }
        const response = await this.client.preparePayment(
          test.address,
          payment,
          instructionsWithMaxLedgerVersionOffset,
        )
        assertResultMatch(response, expected, 'prepare')
      })

      it('XRP to XRP drops', async function () {
        this.mockRippled.addResponse('server_info', rippled.server_info.normal)
        this.mockRippled.addResponse('fee', rippled.fee)
        this.mockRippled.addResponse('ledger_current', rippled.ledger_current)
        this.mockRippled.addResponse(
          'account_info',
          rippled.account_info.normal,
        )
        const payment = {
          source: {
            address: 'r9cZA1mLK5R5Am25ArfXFmqgNwjZgnfk59',
            maxAmount: { value: '1', currency: 'XRP' },
          },
          destination: {
            address: 'rpZc4mVfWUif9CRoHRKKcmhu1nx2xktxBo',
            amount: { value: '1000000', currency: 'drops' },
          },
        }
        const expected = {
          txJSON:
            '{"TransactionType":"Payment","Account":"r9cZA1mLK5R5Am25ArfXFmqgNwjZgnfk59","Destination":"rpZc4mVfWUif9CRoHRKKcmhu1nx2xktxBo","Amount":"1000000","Flags":2147483648,"LastLedgerSequence":8820051,"Sequence":23,"Fee":"12"}',
          instructions: {
            fee: '0.000012',
            sequence: 23,
            maxLedgerVersion: 8820051,
          },
        }
        const response = await this.client.preparePayment(
          test.address,
          payment,
          instructionsWithMaxLedgerVersionOffset,
        )
        assertResultMatch(response, expected, 'prepare')
      })

      // Errors
      it('rejects promise and does not throw when payment object is invalid', async function () {
        this.mockRippled.addResponse('server_info', rippled.server_info.normal)
        this.mockRippled.addResponse('fee', rippled.fee)
        this.mockRippled.addResponse('ledger_current', rippled.ledger_current)
        this.mockRippled.addResponse(
          'account_info',
          rippled.account_info.normal,
        )
        const payment = {
          source: {
            address: test.address,
            // instead of `maxAmount`
            amount: { value: '1000', currency: 'drops' },
          },
          destination: {
            address: RECIPIENT_ADDRESS,
            amount: { value: '1000', currency: 'drops' },
          },
        }

        return assertRejects(
          this.client.preparePayment(test.address, payment),
          ValidationError,
          'payment must specify either (source.maxAmount and destination.amount) or (source.amount and destination.minAmount)',
        )
      })

      // it("rejects promise and does not throw when field is missing", async function () {
      //   this.mockRippled.addResponse("server_info", rippled.server_info.normal);
      //   this.mockRippled.addResponse("fee", rippled.fee);
      //   this.mockRippled.addResponse("ledger_current", rippled.ledger_current);
      //   this.mockRippled.addResponse(
      //     "account_info",
      //     rippled.account_info.normal
      //   );
      //   // Marking as "any" to get around the fact that TS won't allow this.
      //   const payment: any = {
      //     source: { address: test.address },
      //     destination: {
      //       address: RECIPIENT_ADDRESS,
      //       amount: { value: "1000", currency: "drops" },
      //     },
      //   };

      //   return assertRejects(
      //     this.client.preparePayment(test.address, payment),
      //     ValidationError,
      //     "instance.payment.source is not exactly one from <sourceExactAdjustment>,<maxAdjustment>"
      //   );
      // });

      it('rejects promise and does not throw when fee exceeds maxFeeXRP', async function () {
        this.mockRippled.addResponse('server_info', rippled.server_info.normal)
        this.mockRippled.addResponse('fee', rippled.fee)
        this.mockRippled.addResponse('ledger_current', rippled.ledger_current)
        this.mockRippled.addResponse(
          'account_info',
          rippled.account_info.normal,
        )
        const payment = {
          source: {
            address: test.address,
            maxAmount: { value: '1000', currency: 'drops' },
          },
          destination: {
            address: RECIPIENT_ADDRESS,
            amount: { value: '1000', currency: 'drops' },
          },
        }
        return assertRejects(
          this.client.preparePayment(test.address, payment, { fee: '3' }),
          ValidationError,
          'Fee of 3 XRP exceeds max of 2 XRP. To use this fee, increase `maxFeeXRP` in the Client constructor.',
        )
      })

      it('XRP to XRP no partial', async function () {
        this.mockRippled.addResponse('server_info', rippled.server_info.normal)
        this.mockRippled.addResponse('fee', rippled.fee)
        this.mockRippled.addResponse('ledger_current', rippled.ledger_current)
        this.mockRippled.addResponse(
          'account_info',
          rippled.account_info.normal,
        )
        return assertRejects(
          this.client.preparePayment(
            test.address,
            REQUEST_FIXTURES.wrongPartial,
          ),
          ValidationError,
          'XRP to XRP payments cannot be partial payments',
        )
      })

      it('address must match payment.source.address', async function () {
        this.mockRippled.addResponse('server_info', rippled.server_info.normal)
        this.mockRippled.addResponse('fee', rippled.fee)
        this.mockRippled.addResponse('ledger_current', rippled.ledger_current)
        this.mockRippled.addResponse(
          'account_info',
          rippled.account_info.normal,
        )
        return assertRejects(
          this.client.preparePayment(
            test.address,
            REQUEST_FIXTURES.wrongAddress,
          ),
          ValidationError,
          'address must match payment.source.address',
        )
      })

      it('wrong amount', async function () {
        this.mockRippled.addResponse('server_info', rippled.server_info.normal)
        this.mockRippled.addResponse('fee', rippled.fee)
        this.mockRippled.addResponse('ledger_current', rippled.ledger_current)
        this.mockRippled.addResponse(
          'account_info',
          rippled.account_info.normal,
        )
        return assertRejects(
          this.client.preparePayment(
            test.address,
            REQUEST_FIXTURES.wrongAmount,
          ),
          ValidationError,
          'payment must specify either (source.maxAmount and destination.amount) or (source.amount and destination.minAmount)',
        )
      })

      it('throws when fee exceeds 2 XRP', async function () {
        this.mockRippled.addResponse('server_info', rippled.server_info.normal)
        this.mockRippled.addResponse('fee', rippled.fee)
        this.mockRippled.addResponse('ledger_current', rippled.ledger_current)
        this.mockRippled.addResponse(
          'account_info',
          rippled.account_info.normal,
        )
        const localInstructions = {
          ...instructionsWithMaxLedgerVersionOffset,
          fee: '2.1',
        }
        return assertRejects(
          this.client.preparePayment(
            test.address,
            REQUEST_FIXTURES.normal,
            localInstructions,
          ),
          ValidationError,
          'Fee of 2.1 XRP exceeds max of 2 XRP. To use this fee, increase `maxFeeXRP` in the Client constructor.',
        )
      })

      // 'preparePayment with all options specified': async (client, test.address) => {
      //   const ledgerResponse = await this.client.request({command: 'ledger', ledger_index: 'validated'})
      //   const version = ledgerResponse.result.ledger_index
      //   const localInstructions = {
      //     maxLedgerVersion: version + 100,
      //     fee: '0.000012'
      //   }
      //   const response = await this.client.preparePayment(
      //     test.address,
      //     REQUEST_FIXTURES.allOptions,
      //     localInstructions
      //   )
      //   assertResultMatch(response, RESPONSE_FIXTURES.allOptions, 'prepare')
      // },

      it('preparePayment without counterparty set', async function () {
        this.mockRippled.addResponse('server_info', rippled.server_info.normal)
        this.mockRippled.addResponse('fee', rippled.fee)
        this.mockRippled.addResponse('ledger_current', rippled.ledger_current)
        this.mockRippled.addResponse(
          'account_info',
          rippled.account_info.normal,
        )
        const localInstructions = {
          ...instructionsWithMaxLedgerVersionOffset,
          sequence: 23,
        }
        const response = await this.client.preparePayment(
          test.address,
          REQUEST_FIXTURES.noCounterparty,
          localInstructions,
        )
        assertResultMatch(response, RESPONSE_FIXTURES.noCounterparty, 'prepare')
      })

      it('preparePayment with source.amount/destination.minAmount can be signed', async function () {
        this.mockRippled.addResponse('server_info', rippled.server_info.normal)
        this.mockRippled.addResponse('fee', rippled.fee)
        this.mockRippled.addResponse('ledger_current', rippled.ledger_current)
        this.mockRippled.addResponse(
          'account_info',
          rippled.account_info.normal,
        )
        // See also: 'sign succeeds with source.amount/destination.minAmount'

        const localInstructions = {
          ...instructionsWithMaxLedgerVersionOffset,
          sequence: 23,
        }
        const response = await this.client.preparePayment(
          test.address,
          REQUEST_FIXTURES.noCounterparty,
          localInstructions,
        )
        assertResultMatch(response, RESPONSE_FIXTURES.noCounterparty, 'prepare')
      })

      it('destination.minAmount', async function () {
        this.mockRippled.addResponse('server_info', rippled.server_info.normal)
        this.mockRippled.addResponse('fee', rippled.fee)
        this.mockRippled.addResponse('ledger_current', rippled.ledger_current)
        this.mockRippled.addResponse(
          'account_info',
          rippled.account_info.normal,
        )
        const response = await this.client.preparePayment(
          test.address,
          responses.getPaths.sendAll[0],
          instructionsWithMaxLedgerVersionOffset,
        )
        assertResultMatch(response, RESPONSE_FIXTURES.minAmount, 'prepare')
      })

      it('caps fee at 2 XRP by default', async function () {
        this.mockRippled.addResponse('server_info', rippled.server_info.normal)
        this.mockRippled.addResponse('fee', rippled.fee)
        this.mockRippled.addResponse('ledger_current', rippled.ledger_current)
        this.mockRippled.addResponse(
          'account_info',
          rippled.account_info.normal,
        )
        this.client.feeCushion = 1000000
        const expectedResponse = {
          txJSON:
            '{"Flags":2147483648,"TransactionType":"Payment","Account":"r9cZA1mLK5R5Am25ArfXFmqgNwjZgnfk59","Destination":"rpZc4mVfWUif9CRoHRKKcmhu1nx2xktxBo","Amount":{"value":"0.01","currency":"USD","issuer":"rMH4UxPrbuMa1spCBR98hLLyNJp4d8p4tM"},"SendMax":{"value":"0.01","currency":"USD","issuer":"rMH4UxPrbuMa1spCBR98hLLyNJp4d8p4tM"},"LastLedgerSequence":8820051,"Fee":"2000000","Sequence":23}',
          instructions: {
            fee: '2',
            sequence: 23,
            maxLedgerVersion: 8820051,
          },
        }
        const response = await this.client.preparePayment(
          test.address,
          REQUEST_FIXTURES.normal,
          instructionsWithMaxLedgerVersionOffset,
        )
        assertResultMatch(response, expectedResponse, 'prepare')
      })

      it('allows fee exceeding 2 XRP when maxFeeXRP is higher', async function () {
        this.mockRippled.addResponse('server_info', rippled.server_info.normal)
        this.mockRippled.addResponse('fee', rippled.fee)
        this.mockRippled.addResponse('ledger_current', rippled.ledger_current)
        this.mockRippled.addResponse(
          'account_info',
          rippled.account_info.normal,
        )
        this.client.maxFeeXRP = '2.2'
        const localInstructions = {
          ...instructionsWithMaxLedgerVersionOffset,
          fee: '2.1',
        }
        const expectedResponse = {
          txJSON:
            '{"Flags":2147483648,"TransactionType":"Payment","Account":"r9cZA1mLK5R5Am25ArfXFmqgNwjZgnfk59","Destination":"rpZc4mVfWUif9CRoHRKKcmhu1nx2xktxBo","Amount":{"value":"0.01","currency":"USD","issuer":"rMH4UxPrbuMa1spCBR98hLLyNJp4d8p4tM"},"SendMax":{"value":"0.01","currency":"USD","issuer":"rMH4UxPrbuMa1spCBR98hLLyNJp4d8p4tM"},"LastLedgerSequence":8820051,"Fee":"2100000","Sequence":23}',
          instructions: {
            fee: '2.1',
            sequence: 23,
            maxLedgerVersion: 8820051,
          },
        }
        const response = await this.client.preparePayment(
          test.address,
          REQUEST_FIXTURES.normal,
          localInstructions,
        )
        assertResultMatch(response, expectedResponse, 'prepare')
      })

      it('fee - default maxFee of 2 XRP', async function () {
        this.mockRippled.addResponse('server_info', rippled.server_info.normal)
        this.mockRippled.addResponse('fee', rippled.fee)
        this.mockRippled.addResponse('ledger_current', rippled.ledger_current)
        this.mockRippled.addResponse(
          'account_info',
          rippled.account_info.normal,
        )
        this.client.feeCushion = 1000000
        const expectedResponse = {
          txJSON:
            '{"Flags":2147483648,"TransactionType":"Payment","Account":"r9cZA1mLK5R5Am25ArfXFmqgNwjZgnfk59","Destination":"rpZc4mVfWUif9CRoHRKKcmhu1nx2xktxBo","Amount":{"value":"0.01","currency":"USD","issuer":"rMH4UxPrbuMa1spCBR98hLLyNJp4d8p4tM"},"SendMax":{"value":"0.01","currency":"USD","issuer":"rMH4UxPrbuMa1spCBR98hLLyNJp4d8p4tM"},"LastLedgerSequence":8820051,"Fee":"2000000","Sequence":23}',
          instructions: {
            fee: '2',
            sequence: 23,
            maxLedgerVersion: 8820051,
          },
        }
        const response = await this.client.preparePayment(
          test.address,
          requests.preparePayment.normal,
          instructionsWithMaxLedgerVersionOffset,
        )
        assertResultMatch(response, expectedResponse, 'prepare')
      })

      it('fee - capped to maxFeeXRP when maxFee exceeds maxFeeXRP', async function () {
        this.mockRippled.addResponse('server_info', rippled.server_info.normal)
        this.mockRippled.addResponse('fee', rippled.fee)
        this.mockRippled.addResponse('ledger_current', rippled.ledger_current)
        this.mockRippled.addResponse(
          'account_info',
          rippled.account_info.normal,
        )
        this.client.feeCushion = 1000000
        this.client.maxFeeXRP = '3'
        const localInstructions = {
          ...instructionsWithMaxLedgerVersionOffset,
          maxFee: '4',
        }
        const expectedResponse = {
          txJSON:
            '{"Flags":2147483648,"TransactionType":"Payment","Account":"r9cZA1mLK5R5Am25ArfXFmqgNwjZgnfk59","Destination":"rpZc4mVfWUif9CRoHRKKcmhu1nx2xktxBo","Amount":{"value":"0.01","currency":"USD","issuer":"rMH4UxPrbuMa1spCBR98hLLyNJp4d8p4tM"},"SendMax":{"value":"0.01","currency":"USD","issuer":"rMH4UxPrbuMa1spCBR98hLLyNJp4d8p4tM"},"LastLedgerSequence":8820051,"Fee":"3000000","Sequence":23}',
          instructions: {
            fee: '3',
            sequence: 23,
            maxLedgerVersion: 8820051,
          },
        }
        const response = await this.client.preparePayment(
          test.address,
          requests.preparePayment.normal,
          localInstructions,
        )
        assertResultMatch(response, expectedResponse, 'prepare')
      })

      it('fee - capped to maxFee', async function () {
        this.mockRippled.addResponse('server_info', rippled.server_info.normal)
        this.mockRippled.addResponse('fee', rippled.fee)
        this.mockRippled.addResponse('ledger_current', rippled.ledger_current)
        this.mockRippled.addResponse(
          'account_info',
          rippled.account_info.normal,
        )
        this.client.feeCushion = 1000000
        this.client.maxFeeXRP = '5'
        const localInstructions = {
          ...instructionsWithMaxLedgerVersionOffset,
          maxFee: '4',
        }
        const expectedResponse = {
          txJSON:
            '{"Flags":2147483648,"TransactionType":"Payment","Account":"r9cZA1mLK5R5Am25ArfXFmqgNwjZgnfk59","Destination":"rpZc4mVfWUif9CRoHRKKcmhu1nx2xktxBo","Amount":{"value":"0.01","currency":"USD","issuer":"rMH4UxPrbuMa1spCBR98hLLyNJp4d8p4tM"},"SendMax":{"value":"0.01","currency":"USD","issuer":"rMH4UxPrbuMa1spCBR98hLLyNJp4d8p4tM"},"LastLedgerSequence":8820051,"Fee":"4000000","Sequence":23}',
          instructions: {
            fee: '4',
            sequence: 23,
            maxLedgerVersion: 8820051,
          },
        }
        const response = await this.client.preparePayment(
          test.address,
          requests.preparePayment.normal,
          localInstructions,
        )
        assertResultMatch(response, expectedResponse, 'prepare')
      })

      // 'fee - calculated fee does not use more than 6 decimal places': async (
      //   client,
      //   test.address
      // ) => {
      //   this.client.connection.request({
      //     command: 'config',
      //     data: {loadFactor: 5407.96875}
      //   })
      //   const expectedResponse = {
      //     txJSON:
      //       '{"Flags":2147483648,"TransactionType":"Payment","Account":"r9cZA1mLK5R5Am25ArfXFmqgNwjZgnfk59","Destination":"rpZc4mVfWUif9CRoHRKKcmhu1nx2xktxBo","Amount":{"value":"0.01","currency":"USD","issuer":"rMH4UxPrbuMa1spCBR98hLLyNJp4d8p4tM"},"SendMax":{"value":"0.01","currency":"USD","issuer":"rMH4UxPrbuMa1spCBR98hLLyNJp4d8p4tM"},"LastLedgerSequence":8820051,"Fee":"64896","Sequence":23}',
      //     instructions: {
      //       fee: '0.064896',
      //       sequence: 23,
      //       maxLedgerVersion: 8820051
      //     }
      //   }
      //   const response = await this.client.preparePayment(
      //     test.address,
      //     requests.preparePayment.normal,
      //     instructionsWithMaxLedgerVersionOffset
      //   )
      //   assertResultMatch(response, expectedResponse, 'prepare')
      // },

      // Tickets
      // 'preparePayment with ticketSequence': async (client, test.address) => {
      //   const ledgerResponse = await this.client.request({
      //     command: 'ledger',
      //     ledger_index: 'validated'
      //   })
      //   const version = ledgerResponse.result.ledger_index
      //   const localInstructions = {
      //     maxLedgerVersion: version + 100,
      //     fee: '0.000012',
      //     ticketSequence: 23
      //   }
      //   const response = await this.client.preparePayment(
      //     test.address,
      //     REQUEST_FIXTURES.allOptions,
      //     localInstructions
      //   )
      //   assertResultMatch(response, RESPONSE_FIXTURES.ticketSequence, 'prepare')
      // },

      // 'throws when both sequence and ticketSequence are set': async (
      //   client,
      //   test.address
      // ) => {
      //   const ledgerResponse = await this.client.request({
      //     command: 'ledger',
      //     ledger_index: 'validated'
      //   })
      //   const version = ledgerResponse.result.ledger_index
      //   const localInstructions = {
      //     maxLedgerVersion: version + 100,
      //     fee: '0.000012',
      //     ticketSequence: 23,
      //     sequence: 12
      //   }
      //   return assertRejects(
      //     this.client.preparePayment(
      //       test.address,
      //       REQUEST_FIXTURES.allOptions,
      //       localInstructions
      //     ),
      //     ValidationError,
      //     'instance.instructions is of prohibited type [object Object]'
      //   )
      // }
    })
  })
})
