import requests from '../../fixtures/requests'
import responses from '../../fixtures/responses'
import {assertRejects, assertResultMatch, TestSuite} from '../../utils'
const instructionsWithMaxLedgerVersionOffset = {maxLedgerVersionOffset: 100}

/**
 * Every test suite exports their tests in the default object.
 * - Check out the "TestSuite" type for documentation on the interface.
 * - Check out "test/api/index.ts" for more information about the test runner.
 */
export default <TestSuite>{
  'simple': async (api, address) => {
    const result = await api.prepareTrustline(
      address,
      requests.prepareTrustline.simple,
      instructionsWithMaxLedgerVersionOffset
    )
    assertResultMatch(result, responses.prepareTrustline.simple, 'prepare')
  },

  'frozen': async (api, address) => {
    const result = await api.prepareTrustline(
      address,
      requests.prepareTrustline.frozen
    )
    assertResultMatch(result, responses.prepareTrustline.frozen, 'prepare')
  },

  'complex': async (api, address) => {
    const result = await api.prepareTrustline(
      address,
      requests.prepareTrustline.complex,
      instructionsWithMaxLedgerVersionOffset
    )
    assertResultMatch(result, responses.prepareTrustline.complex, 'prepare')
  },

  'invalid': async (api, address) => {
    const trustline = Object.assign({}, requests.prepareTrustline.complex)
    delete trustline.limit // Make invalid

    await assertRejects(
      api.prepareTrustline(
        address,
        trustline,
        instructionsWithMaxLedgerVersionOffset
      ),
      api.errors.ValidationError,
      'instance.trustline requires property "limit"'
    )
  },

  'with ticket': async (api, address) => {
    const localInstructions = {
      ...instructionsWithMaxLedgerVersionOffset,
      maxFee: '0.000012',
      ticketSequence: 23
    }
    const result = await api.prepareTrustline(
      address,
      requests.prepareTrustline.simple,
      localInstructions
    )
    assertResultMatch(result, responses.prepareTrustline.ticket, 'prepare')
  }
}
