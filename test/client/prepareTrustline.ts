import requests from '../../fixtures/requests'
import responses from '../../fixtures/responses'
import rippled from '../../fixtures/rippled'
import {assertRejects, assertResultMatch, TestSuite} from '../../testUtils'
const instructionsWithMaxLedgerVersionOffset = {maxLedgerVersionOffset: 100}

/**
 * Every test suite exports their tests in the default object.
 * - Check out the "TestSuite" type for documentation on the interface.
 * - Check out "test/client/index.ts" for more information about the test runner.
 */
export default <TestSuite>{
  'simple': async (client, address, mockRippled) => {
    mockRippled.addResponse({command: 'server_info'}, rippled.server_info.normal)
    const result = await client.prepareTrustline(
      address,
      requests.prepareTrustline.simple,
      instructionsWithMaxLedgerVersionOffset
    )
    assertResultMatch(result, responses.prepareTrustline.simple, 'prepare')
  },

  'frozen': async (client, address, mockRippled) => {
    mockRippled.addResponse({command: 'server_info'}, rippled.server_info.normal)
    const result = await client.prepareTrustline(
      address,
      requests.prepareTrustline.frozen
    )
    assertResultMatch(result, responses.prepareTrustline.frozen, 'prepare')
  },

  'complex': async (client, address, mockRippled) => {
    mockRippled.addResponse({command: 'server_info'}, rippled.server_info.normal)
    const result = await client.prepareTrustline(
      address,
      requests.prepareTrustline.complex,
      instructionsWithMaxLedgerVersionOffset
    )
    assertResultMatch(result, responses.prepareTrustline.complex, 'prepare')
  },

  'invalid': async (client, address, mockRippled) => {
    mockRippled.addResponse({command: 'server_info'}, rippled.server_info.normal)
    const trustline = Object.assign({}, requests.prepareTrustline.complex)
    delete trustline.limit // Make invalid

    await assertRejects(
      client.prepareTrustline(
        address,
        trustline,
        instructionsWithMaxLedgerVersionOffset
      ),
      client.errors.ValidationError,
      'instance.trustline requires property "limit"'
    )
  },

  'xaddress-issuer': async (client, address, mockRippled) => {
    mockRippled.addResponse({command: 'server_info'}, rippled.server_info.normal)
    const result = await client.prepareTrustline(
      address,
      requests.prepareTrustline.issuedXAddress,
      instructionsWithMaxLedgerVersionOffset
    )
    assertResultMatch(result, responses.prepareTrustline.issuedXAddress, 'prepare')
  },

  'with ticket': async (client, address, mockRippled) => {
    mockRippled.addResponse({command: 'server_info'}, rippled.server_info.normal)
    const localInstructions = {
      ...instructionsWithMaxLedgerVersionOffset,
      maxFee: '0.000012',
      ticketSequence: 23
    }
    const result = await client.prepareTrustline(
      address,
      requests.prepareTrustline.simple,
      localInstructions
    )
    assertResultMatch(result, responses.prepareTrustline.ticket, 'prepare')
  }
}
