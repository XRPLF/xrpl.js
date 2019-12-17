import assert from 'assert-diff'
import responses from '../../fixtures/responses'
import {assertResultMatch, TestSuite, assertRejects} from '../../utils'

/**
 * Every test suite exports their tests in the default object.
 * - Check out the "TestSuite" type for documentation on the interface.
 * - Check out "test/api/index.ts" for more information about the test runner.
 */
export default <TestSuite>{
  'default': async (api, address) => {
    const serverInfo = await api.getServerInfo()
    assertResultMatch(serverInfo, responses.getServerInfo, 'getServerInfo')
  },

  'error': async (api, address) => {
    api.connection._send(
      JSON.stringify({
        command: 'config',
        data: {returnErrorOnServerInfo: true}
      })
    )
    try {
      await api.getServerInfo()
      throw new Error('Should throw NetworkError')
    } catch (err) {
      assert(err instanceof api.errors.RippledError)
      assert.equal(err.message, 'You are placing too much load on the server.')
      assert.equal(err.data.error, 'slowDown')
    }
  },

  'no validated ledger': async (api, address) => {
    api.connection._send(
      JSON.stringify({
        command: 'config',
        data: {serverInfoWithoutValidated: true}
      })
    )
    const serverInfo = await api.getServerInfo()
    assert.strictEqual(serverInfo.networkLedger, 'waiting')
  },

  'getServerInfo - offline': async (api, address) => {
    await api.disconnect()
    return assertRejects(api.getServerInfo(), api.errors.NotConnectedError)
  }
}
