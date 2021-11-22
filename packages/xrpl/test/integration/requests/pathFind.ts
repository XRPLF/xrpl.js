import { assert } from 'chai'
import _ from 'lodash'

import {
  PathFindRequest,
  PathFindResponse,
  Client,
  PathFindStream,
} from 'xrpl-local'

import serverUrl from '../serverUrl'
import { setupClient, teardownClient } from '../setup'
import { generateFundedWallet, ledgerAccept, subscribeDone } from '../utils'

// how long before each test case times out
const TIMEOUT = 20000

describe('path_find', function () {
  this.timeout(TIMEOUT)

  beforeEach(_.partial(setupClient, serverUrl))
  afterEach(teardownClient)

  it('base', async function () {
    const wallet2 = await generateFundedWallet(this.client)
    const pathFind: PathFindRequest = {
      command: 'path_find',
      subcommand: 'create',
      source_account: this.wallet.classicAddress,
      destination_account: wallet2.classicAddress,
      destination_amount: '100',
    }

    const response = await this.client.request(pathFind)

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
  })

  /**
   * For other stream style tests look at integration/requests/subscribe.ts
   * Note: This test uses '.then' to avoid awaits in order to use 'done' style tests.
   */
  it('path_find stream succeeds', function (done) {
    generateFundedWallet(this.client)
      .then((wallet2) => {
        const pathFind: PathFindRequest = {
          command: 'path_find',
          subcommand: 'create',
          source_account: this.wallet.classicAddress,
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

        const client: Client = this.client
        client.on('path_find', (path) => {
          assert.equal(path.type, 'path_find')
          assert.deepEqual(
            _.omit(path, 'id'),
            _.omit(expectedStreamResult, 'id'),
          )
          subscribeDone(this.client, done)
        })

        this.client.request(pathFind).then((response) => {
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
        })
      })
      .then(() => {
        ledgerAccept(this.client)
      })
  })
})
