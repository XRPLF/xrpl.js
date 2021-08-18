import requests from '../../fixtures/requests'
import responses from '../../fixtures/responses'
import {assertRejects, assertResultMatch, TestSuite} from '../../utils'
const instructionsWithMaxLedgerVersionOffset = {maxLedgerVersionOffset: 100}

export const config = {
  // TODO: The mock server right now returns a hard-coded string, no matter
  // what "Account" value you pass. We'll need it to support more accurate
  // responses before we can turn these tests on.
  skipXAddress: true
}

/**
 * Every test suite exports their tests in the default object.
 * - Check out the "TestSuite" type for documentation on the interface.
 * - Check out "test/client/index.ts" for more information about the test runner.
 */
export default <TestSuite>{
  'prepareEscrowCreation': async (client, address) => {
    const localInstructions = {
      ...instructionsWithMaxLedgerVersionOffset,
      maxFee: '0.000012'
    }
    const result = await client.prepareEscrowCreation(
      address,
      requests.prepareEscrowCreation.normal,
      localInstructions
    )
    assertResultMatch(result, responses.prepareEscrowCreation.normal, 'prepare')
  },

  'prepareEscrowCreation full': async (client, address) => {
    const result = await client.prepareEscrowCreation(
      address,
      requests.prepareEscrowCreation.full
    )
    assertResultMatch(result, responses.prepareEscrowCreation.full, 'prepare')
  },

  'prepareEscrowCreation - invalid': async (client, address) => {
    const escrow = Object.assign({}, requests.prepareEscrowCreation.full)
    delete escrow.amount // Make invalid
    await assertRejects(
      client.prepareEscrowCreation(address, escrow),
      client.errors.ValidationError,
      'instance.escrowCreation requires property "amount"'
    )
  },

  'with ticket': async (client, address) => {
    const localInstructions = {
      ...instructionsWithMaxLedgerVersionOffset,
      maxFee: '0.000396',
      ticketSequence: 23
    }
    const result = await client.prepareEscrowCreation(
      address,
      requests.prepareEscrowCreation.normal,
      localInstructions
    )
    assertResultMatch(result, responses.prepareEscrowCreation.ticket, 'prepare')
  }
}
