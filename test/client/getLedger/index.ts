import assert from 'assert-diff'
import {assertResultMatch, TestSuite} from '../../utils'
import responses from '../../fixtures/responses'
const {getLedger: RESPONSE_FIXTURES} = responses

/**
 * Every test suite exports their tests in the default object.
 * - Check out the "TestSuite" type for documentation on the interface.
 * - Check out "test/client/index.ts" for more information about the test runner.
 */
export default <TestSuite>{
  'simple test': async (client) => {
    const response = await client.getLedger()
    assertResultMatch(response, RESPONSE_FIXTURES.header, 'getLedger')
  },
  'by hash': async (client) => {
    const response = await client.getLedger({
      ledgerHash:
        '15F20E5FA6EA9770BBFFDBD62787400960B04BE32803B20C41F117F41C13830D'
    })
    assertResultMatch(response, RESPONSE_FIXTURES.headerByHash, 'getLedger')
  },
  'future ledger version': async (client) => {
    const response = await client.getLedger({ledgerVersion: 14661789})
    assert(!!response)
  },
  'with state as hashes': async (client) => {
    const request = {
      includeTransactions: true,
      includeAllData: false,
      includeState: true,
      ledgerVersion: 6
    }
    const response = await client.getLedger(request)
    assertResultMatch(
      response,
      RESPONSE_FIXTURES.withStateAsHashes,
      'getLedger'
    )
  },
  'with settings transaction': async (client) => {
    const request = {
      includeTransactions: true,
      includeAllData: true,
      ledgerVersion: 4181996
    }
    const response = await client.getLedger(request)
    assertResultMatch(response, RESPONSE_FIXTURES.withSettingsTx, 'getLedger')
  },
  'with partial payment': async (client) => {
    const request = {
      includeTransactions: true,
      includeAllData: true,
      ledgerVersion: 22420574
    }
    const response = await client.getLedger(request)
    assertResultMatch(response, RESPONSE_FIXTURES.withPartial, 'getLedger')
  },
  'pre 2014 with partial payment': async (client) => {
    const request = {
      includeTransactions: true,
      includeAllData: true,
      ledgerVersion: 100001
    }
    const response = await client.getLedger(request)
    assertResultMatch(
      response,
      RESPONSE_FIXTURES.pre2014withPartial,
      'getLedger'
    )
  },
  'full, then computeLedgerHash': async (client) => {
    const request = {
      includeTransactions: true,
      includeState: true,
      includeAllData: true,
      ledgerVersion: 38129
    }
    const response = await client.getLedger(request)
    assertResultMatch(response, RESPONSE_FIXTURES.full, 'getLedger')
    const ledger = {
      ...response,
      parentCloseTime: response.closeTime
    }
    const hash = client.computeLedgerHash(ledger, {computeTreeHashes: true})
    assert.strictEqual(
      hash,
      'E6DB7365949BF9814D76BCC730B01818EB9136A89DB224F3F9F5AAE4569D758E'
    )
  }
}
