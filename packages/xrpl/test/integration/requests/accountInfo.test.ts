import { assert } from 'chai'
import omit from 'lodash/omit'

import { AccountInfoRequest } from '../../../src'
import serverUrl from '../serverUrl'
import {
  setupClient,
  teardownClient,
  type XrplIntegrationTestContext,
} from '../setup'

// how long before each test case times out
const TIMEOUT = 20000

describe('account_info', function () {
  let testContext: XrplIntegrationTestContext

  beforeEach(async () => {
    testContext = await setupClient(serverUrl)
  })
  afterEach(async () => teardownClient(testContext))

  it(
    'base',
    async () => {
      const request: AccountInfoRequest = {
        command: 'account_info',
        account: testContext.wallet.classicAddress,
        strict: true,
        ledger_index: 'validated',
      }
      const response = await testContext.client.request(request)
      const expected = {
        id: 0,
        result: {
          account_data: {
            Account: testContext.wallet.classicAddress,
            Balance: '400000000',
            Flags: 0,
            LedgerEntryType: 'AccountRoot',
            OwnerCount: 0,
            PreviousTxnID:
              '19A8211695785A3A02C1C287D93C2B049E83A9CD609825E721052D63FF4F0EC8',
            PreviousTxnLgrSeq: 582,
            Sequence: 283,
            index:
              'BD4815E6EB304136E6044F778FB68D4E464CC8DFC59B8F6CC93D90A3709AE194',
          },
          ledger_hash:
            'F0DEEC46A7185BBB535517EE38CF2025973022D5B0532B36407F492521FDB0C6',
          ledger_index: 582,
          validated: true,
        },
        type: 'response',
      }
      assert.equal(response.type, expected.type)
      assert.equal(response.result.validated, expected.result.validated)
      assert.equal(typeof response.result.ledger_index, 'number')
      assert.equal(typeof response.result.account_data.PreviousTxnID, 'string')
      assert.equal(typeof response.result.account_data.index, 'string')
      assert.equal(
        typeof response.result.account_data.PreviousTxnLgrSeq,
        'number',
      )
      assert.equal(typeof response.result.account_data.Sequence, 'number')
      assert.deepEqual(
        omit(response.result.account_data, [
          'PreviousTxnID',
          'PreviousTxnLgrSeq',
          'Sequence',
          'index',
        ]),
        omit(expected.result.account_data, [
          'PreviousTxnID',
          'PreviousTxnLgrSeq',
          'Sequence',
          'index',
        ]),
      )
    },
    TIMEOUT,
  )

  it(
    'uses api_version 1',
    async () => {
      const request: AccountInfoRequest = {
        command: 'account_info',
        account: testContext.wallet.classicAddress,
        strict: true,
        ledger_index: 'validated',
        api_version: 1,
      }
      const response = await testContext.client.request(request)
      const expected = {
        id: 0,
        result: {
          account_data: {
            Account: testContext.wallet.classicAddress,
            Balance: '400000000',
            Flags: 0,
            LedgerEntryType: 'AccountRoot',
            OwnerCount: 0,
            PreviousTxnID:
              '19A8211695785A3A02C1C287D93C2B049E83A9CD609825E721052D63FF4F0EC8',
            PreviousTxnLgrSeq: 582,
            Sequence: 283,
            index:
              'BD4815E6EB304136E6044F778FB68D4E464CC8DFC59B8F6CC93D90A3709AE194',
          },
          ledger_hash:
            'F0DEEC46A7185BBB535517EE38CF2025973022D5B0532B36407F492521FDB0C6',
          ledger_index: 582,
          validated: true,
        },
        type: 'response',
      }
      assert.equal(response.type, expected.type)
      assert.equal(response.result.validated, expected.result.validated)
      assert.equal(typeof response.result.ledger_index, 'number')
      assert.equal(typeof response.result.account_data.PreviousTxnID, 'string')
      assert.equal(typeof response.result.account_data.index, 'string')
      assert.equal(
        typeof response.result.account_data.PreviousTxnLgrSeq,
        'number',
      )
      assert.equal(typeof response.result.account_data.Sequence, 'number')
      assert.deepEqual(
        omit(response.result.account_data, [
          'PreviousTxnID',
          'PreviousTxnLgrSeq',
          'Sequence',
          'index',
        ]),
        omit(expected.result.account_data, [
          'PreviousTxnID',
          'PreviousTxnLgrSeq',
          'Sequence',
          'index',
        ]),
      )
    },
    TIMEOUT,
  )

  it(
    'signer_list using api_version 1',
    async () => {
      const request: AccountInfoRequest = {
        command: 'account_info',
        account: testContext.wallet.classicAddress,
        strict: true,
        ledger_index: 'validated',
        signer_lists: true,
        api_version: 1,
      }
      const response = await testContext.client.request<AccountInfoRequest, 1>(
        request,
      )
      expect(response.result.account_data.signer_lists).toEqual([])
      // @ts-expect-error -- signer_lists is expected to be undefined
      expect(response.result.signer_lists).toBeUndefined()
    },
    TIMEOUT,
  )

  it(
    'signer_list using api_version 2',
    async () => {
      const request: AccountInfoRequest = {
        command: 'account_info',
        account: testContext.wallet.classicAddress,
        strict: true,
        ledger_index: 'validated',
        signer_lists: true,
      }
      const response = await testContext.client.request(request)
      // @ts-expect-error -- signer_lists is expected to be undefined
      expect(response.result.account_data.signer_lists).toBeUndefined()
      expect(response.result.signer_lists).toEqual([])
    },
    TIMEOUT,
  )
})
