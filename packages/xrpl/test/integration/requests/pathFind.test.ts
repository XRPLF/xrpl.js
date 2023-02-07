import { assert } from 'chai'
import omit from 'lodash/omit'

import {
  PathFindRequest,
  PathFindResponse,
  Client,
  PathFindStream,
} from '../../../src'
import serverUrl from '../serverUrl'
import {
  setupClient,
  teardownClient,
  type XrplIntegrationTestContext,
} from '../setup'
import { generateFundedWallet, ledgerAccept, subscribeDone } from '../utils'

// how long before each test case times out
const TIMEOUT = 20000

describe('path_find', function () {
  let testContext: XrplIntegrationTestContext

  beforeEach(async () => {
    testContext = await setupClient(serverUrl)
  })
  afterEach(async () => teardownClient(testContext))

  it(
    'base',
    async () => {
      const wallet2 = await generateFundedWallet(testContext.client)
      const pathFind: PathFindRequest = {
        command: 'path_find',
        subcommand: 'create',
        source_account: testContext.wallet.classicAddress,
        destination_account: wallet2.classicAddress,
        destination_amount: '100',
      }

      const response = await testContext.client.request(pathFind)

      const expectedResponse: PathFindResponse = {
        id: response.id,
        type: 'response',
        result: {
          alternatives: response.result.alternatives,
          destination_account: pathFind.destination_account,
          destination_amount: pathFind.destination_amount,
          source_account: pathFind.source_account,
          full_reply: false,
          id: response.id,
        },
      }

      assert.deepEqual(response, expectedResponse)
    },
    TIMEOUT,
  )

  /**
   * For other stream style tests look at integration/requests/subscribe.ts
   * Note: This test uses '.then' to avoid awaits in order to use 'done' style tests.
   */
  it(
    'path_find stream succeeds',
    async () => {
      const wallet2 = await generateFundedWallet(testContext.client)
      const pathFind: PathFindRequest = {
        command: 'path_find',
        subcommand: 'create',
        source_account: testContext.wallet.classicAddress,
        destination_account: wallet2.classicAddress,
        destination_amount: '100',
      }

      const expectedStreamResult: PathFindStream = {
        type: 'path_find',
        source_account: pathFind.source_account,
        destination_account: pathFind.destination_account,
        destination_amount: pathFind.destination_amount,
        full_reply: true,
        id: 10,
        alternatives: [],
      }

      const client: Client = testContext.client

      const pathFindPromise = new Promise<void>((resolve) => {
        client.on('path_find', (path) => {
          assert.equal(path.type, 'path_find')
          assert.deepEqual(omit(path, 'id'), omit(expectedStreamResult, 'id'))
          subscribeDone(testContext.client)
          resolve()
        })
      })

      const response = await testContext.client.request(pathFind)

      const expectedResponse: PathFindResponse = {
        id: response.id,
        type: 'response',
        result: {
          alternatives: response.result.alternatives,
          destination_account: pathFind.destination_account,
          destination_amount: pathFind.destination_amount,
          source_account: pathFind.source_account,
          full_reply: false,
          id: response.id,
        },
      }

      assert.deepEqual(response, expectedResponse)

      await ledgerAccept(testContext.client)

      await pathFindPromise
    },
    TIMEOUT,
  )
})
