import assert from 'assert-diff'
import responses from '../../fixtures/responses'
import {assertResultMatch, TestSuite, assertRejects} from '../../utils'

/**
 * Every test suite exports their tests in the default object.
 * - Check out the "TestSuite" type for documentation on the interface.
 * - Check out "test/client/index.ts" for more information about the test runner.
 */
export default <TestSuite>{
  'default': async (client, address) => {
    const serverInfo = await client.getServerInfo()
    assertResultMatch(serverInfo.result.info, responses.getServerInfo, 'getServerInfo')
  },

  'error': async (client, address) => {
    client.connection.request({
      // @ts-ignore TODO: resolve
      command: 'config',
      data: {returnErrorOnServerInfo: true}
    })
    try {
      await client.getServerInfo()
      throw new Error('Should throw NetworkError')
    } catch (err) {
      assert(err instanceof client.errors.RippledError)
      assert.equal(err.message, 'You are placing too much load on the server.')
      assert.equal(err.data.error, 'slowDown')
    }
  },

  'no validated ledger': async (client, address) => {
    client.connection.request({
      // @ts-ignore TODO: resolve
      command: 'config',
      data: {serverInfoWithoutValidated: true}
    })
    const serverInfo = await client.getServerInfo()
    assert.strictEqual(serverInfo.result.info.network_ledger, 'waiting')
  },

  'getServerInfo - offline': async (client, address) => {
    await client.disconnect()
    return assertRejects(client.getServerInfo(), client.errors.NotConnectedError)
  }
}
