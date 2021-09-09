import responses from '../fixtures/responses'
import rippled from '../fixtures/rippled/accountLines'
import { setupClient, teardownClient } from '../setupClient'
import { assertResultMatch, addressTests } from '../testUtils'

const { getTrustlines: RESPONSE_FIXTURES } = responses

describe('client.getTrustlines', function () {
  beforeEach(setupClient)
  afterEach(teardownClient)

  addressTests.forEach(function (test) {
    describe(test.type, function () {
      it('getTrustlines - filtered', async function () {
        this.mockRippled.addResponse('account_lines', rippled.normal)
        const options = { currency: 'USD' }
        const result = await this.client.getTrustlines(test.address, options)
        assertResultMatch(result, RESPONSE_FIXTURES.filtered, 'getTrustlines')
      })

      it('getTrustlines - more than 400 items', async function () {
        this.mockRippled.addResponse('account_lines', rippled.manyItems)
        const options = { limit: 401 }
        const result = await this.client.getTrustlines(test.address, options)
        assertResultMatch(
          result,
          RESPONSE_FIXTURES.moreThan400Items,
          'getTrustlines',
        )
      })

      it('getTrustlines - no options', async function () {
        this.mockRippled.addResponse('account_lines', rippled.normal)
        await this.client.getTrustlines(test.address)
      })

      it('getTrustlines - ripplingDisabled works properly', async function () {
        this.mockRippled.addResponse('account_lines', rippled.ripplingDisabled)
        const result = await this.client.getTrustlines(test.address)
        assertResultMatch(
          result,
          RESPONSE_FIXTURES.ripplingDisabled,
          'getTrustlines',
        )
      })

      it('getTrustlines - ledger version option', async function () {
        this.mockRippled.addResponse('account_lines', rippled.manyItems)
        const result = await this.client.getTrustlines(test.address, {
          ledgerVersion: 5,
        })
        assertResultMatch(
          result,
          RESPONSE_FIXTURES.moreThan400Items,
          'getTrustlines',
        )
      })
    })
  })
})
