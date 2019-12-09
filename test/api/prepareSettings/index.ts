import assert from 'assert-diff'
import requests from '../../fixtures/requests'
import responses from '../../fixtures/responses'
import { assertResultMatch, TestSuite } from '../../utils'
const instructionsWithMaxLedgerVersionOffset = { maxLedgerVersionOffset: 100 }

/**
 * Every test suite exports their tests in the default object.
 * - Check out the "TestSuite" type for documentation on the interface.
 * - Check out "test/api/index.ts" for more information about the test runner.
 */
export default <TestSuite>{
  'simple test': async (api, address) => {
    const response = await api.prepareSettings(
      address,
      requests.prepareSettings.domain,
      instructionsWithMaxLedgerVersionOffset
    )
    assertResultMatch(response, responses.prepareSettings.flags, 'prepare')
  },
  'no maxLedgerVersion': async (api, address) => {
    const response = await api.prepareSettings(
      address,
      requests.prepareSettings.domain,
      {
        maxLedgerVersion: null
      }
    )
    assertResultMatch(
      response,
      responses.prepareSettings.noMaxLedgerVersion,
      'prepare'
    )
  },
  'no instructions': async (api, address) => {
    const response = await api.prepareSettings(
      address,
      requests.prepareSettings.domain
    )
    assertResultMatch(
      response,
      responses.prepareSettings.noInstructions,
      'prepare'
    )
  },
  'regularKey': async (api, address) => {
    const regularKey = { regularKey: 'rAR8rR8sUkBoCZFawhkWzY4Y5YoyuznwD' }
    const response = await api.prepareSettings(
      address,
      regularKey,
      instructionsWithMaxLedgerVersionOffset
    )
    assertResultMatch(response, responses.prepareSettings.regularKey, 'prepare')
  },
  'remove regularKey': async (api, address) => {
    const regularKey = { regularKey: null }
    const response = await api.prepareSettings(
      address,
      regularKey,
      instructionsWithMaxLedgerVersionOffset
    )
    assertResultMatch(
      response,
      responses.prepareSettings.removeRegularKey,
      'prepare'
    )
  },
  'flag set': async (api, address) => {
    const settings = { requireDestinationTag: true }
    const response = await api.prepareSettings(
      address,
      settings,
      instructionsWithMaxLedgerVersionOffset
    )
    assertResultMatch(response, responses.prepareSettings.flagSet, 'prepare')
  },
  'flag clear': async (api, address) => {
    const settings = { requireDestinationTag: false }
    const response = await api.prepareSettings(
      address,
      settings,
      instructionsWithMaxLedgerVersionOffset
    )
    assertResultMatch(response, responses.prepareSettings.flagClear, 'prepare')
  },
  'set depositAuth flag': async (api, address) => {
    const settings = { depositAuth: true }
    const response = await api.prepareSettings(
      address,
      settings,
      instructionsWithMaxLedgerVersionOffset
    )
    assertResultMatch(
      response,
      responses.prepareSettings.flagSetDepositAuth,
      'prepare'
    )
  },
  'clear depositAuth flag': async (api, address) => {
    const settings = { depositAuth: false }
    const response = await api.prepareSettings(
      address,
      settings,
      instructionsWithMaxLedgerVersionOffset
    )
    assertResultMatch(
      response,
      responses.prepareSettings.flagClearDepositAuth,
      'prepare'
    )
  },
  'integer field clear': async (api, address) => {
    const settings = { transferRate: null }
    const response = await api.prepareSettings(
      address,
      settings,
      instructionsWithMaxLedgerVersionOffset
    )
    assert(response)
    assert.strictEqual(JSON.parse(response.txJSON).TransferRate, 0)
  },
  'set transferRate': async (api, address) => {
    const settings = { transferRate: 1 }
    const response = await api.prepareSettings(
      address,
      settings,
      instructionsWithMaxLedgerVersionOffset
    )
    assertResultMatch(
      response,
      responses.prepareSettings.setTransferRate,
      'prepare'
    )
  },
  'set signers': async (api, address) => {
    const settings = requests.prepareSettings.signers.normal
    const response = await api.prepareSettings(
      address,
      settings,
      instructionsWithMaxLedgerVersionOffset
    )
    assertResultMatch(response, responses.prepareSettings.signers, 'prepare')
  },
  'signers no threshold': async (api, address) => {
    const settings = requests.prepareSettings.signers.noThreshold
    try {
      const response = await api.prepareSettings(
        address,
        settings,
        instructionsWithMaxLedgerVersionOffset
      )
      throw new Error(
        'Expected method to reject. Prepared transaction: ' +
          JSON.stringify(response)
      )
    } catch (err) {
      assert.strictEqual(
        err.message,
        'instance.settings.signers requires property "threshold"'
      )
      assert.strictEqual(err.name, 'ValidationError')
    }
  },
  'signers no weights': async (api, address) => {
    const settings = requests.prepareSettings.signers.noWeights
    const localInstructions = {
      signersCount: 1,
      ...instructionsWithMaxLedgerVersionOffset
    }
    const response = await api.prepareSettings(
      address,
      settings,
      localInstructions
    )
    assertResultMatch(response, responses.prepareSettings.noWeights, 'prepare')
  },
  'fee for multisign': async (api, address) => {
    const localInstructions = {
      signersCount: 4,
      ...instructionsWithMaxLedgerVersionOffset
    }
    const response = await api.prepareSettings(
      address,
      requests.prepareSettings.domain,
      localInstructions
    )
    assertResultMatch(
      response,
      responses.prepareSettings.flagsMultisign,
      'prepare'
    )
  },
  'no signer list': async (api, address) => {
    const settings = requests.prepareSettings.noSignerEntries
    const localInstructions = {
      signersCount: 1,
      ...instructionsWithMaxLedgerVersionOffset
    }
    const response = await api.prepareSettings(
      address,
      settings,
      localInstructions
    )
    assertResultMatch(
      response,
      responses.prepareSettings.noSignerList,
      'prepare'
    )
  },
  'invalid': async (api, address) => {
    // domain must be a string
    const settings = Object.assign({}, requests.prepareSettings.domain, {
      domain: 123
    })
    const localInstructions = {
      signersCount: 4,
      ...instructionsWithMaxLedgerVersionOffset
    }

    try {
      const response = await api.prepareSettings(
        address,
        settings,
        localInstructions
      )
      throw new Error(
        'Expected method to reject. Prepared transaction: ' +
          JSON.stringify(response)
      )
    } catch (err) {
      assert.strictEqual(
        err.message,
        'instance.settings.domain is not of a type(s) string'
      )
      assert.strictEqual(err.name, 'ValidationError')
    }
  },
  'offline': async (api, address) => {
    // const api = new RippleAPI()
    const secret = 'shsWGZcmZz6YsWWmcnpfr6fLTdtFV'

    const settings = requests.prepareSettings.domain
    const instructions = {
      sequence: 23,
      maxLedgerVersion: 8820051,
      fee: '0.000012'
    }
    const result = await api.prepareSettings(address, settings, instructions)
    assertResultMatch(result, responses.prepareSettings.flags, 'prepare')
    assert.deepEqual(
      api.sign(result.txJSON, secret),
      responses.prepareSettings.signed
    )
  }
}
