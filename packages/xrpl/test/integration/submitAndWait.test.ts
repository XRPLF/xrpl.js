/* eslint-disable @typescript-eslint/no-misused-promises -- supposed to return a promise here */
/* eslint-disable no-restricted-syntax -- not sure why this rule is here, definitely not needed here */
import { assert } from 'chai'
import _ from 'lodash'
import { AccountSet, convertStringToHex, ValidationError } from 'xrpl-local'

import { assertRejects } from '../testUtils'

import serverUrl from './serverUrl'
import {
  setupClient,
  teardownClient,
  type XrplIntegrationTestContext,
} from './setup'
import { ledgerAccept } from './utils'

// how long before each test case times out
const TIMEOUT = 60000

describe('client.submitAndWait', () => {
  let testContext: XrplIntegrationTestContext

  beforeEach(async () => {
    testContext = await setupClient(serverUrl)
  })
  afterEach(async () => teardownClient(testContext))

  it(
    'submitAndWait an unsigned transaction',
    async () => {
      const accountSet: AccountSet = {
        TransactionType: 'AccountSet',
        Account: testContext.wallet.classicAddress,
        Domain: convertStringToHex('example.com'),
      }
      const responsePromise = testContext.client.submitAndWait(accountSet, {
        wallet: testContext.wallet,
      })
      const ledgerPromise = setTimeout(ledgerAccept, 1000, testContext.client)
      return Promise.all([responsePromise, ledgerPromise]).then(
        ([response, _ledger]) => {
          assert.equal(response.type, 'response')
          assert.equal(response.result.validated, true)
        },
      )
    },
    TIMEOUT,
  )

  it(
    'should throw a ValidationError when submitting an unsigned transaction without a wallet',
    async () => {
      const accountSet: AccountSet = {
        TransactionType: 'AccountSet',
        Account: testContext.wallet.classicAddress,
        Domain: convertStringToHex('example.com'),
      }

      await assertRejects(
        testContext.client.submitAndWait(accountSet),
        ValidationError,
        'Wallet must be provided when submitting an unsigned transaction',
      )
    },
    TIMEOUT,
  )

  it(
    'submitAndWait a signed transaction',
    async () => {
      const accountSet: AccountSet = {
        TransactionType: 'AccountSet',
        Account: testContext.wallet.classicAddress,
        Domain: convertStringToHex('example.com'),
      }
      const { tx_blob: signedAccountSet } = testContext.wallet.sign(
        await testContext.client.autofill(accountSet),
      )
      const responsePromise = testContext.client.submitAndWait(signedAccountSet)
      const ledgerPromise = setTimeout(ledgerAccept, 1000, testContext.client)
      return Promise.all([responsePromise, ledgerPromise]).then(
        ([response, _ledger]) => {
          assert.equal(response.type, 'response')
          assert.equal(response.result.validated, true)
        },
      )
    },
    TIMEOUT,
  )

  it(
    'submitAndWait a signed transaction longer',
    async () => {
      const accountSet: AccountSet = {
        TransactionType: 'AccountSet',
        Account: testContext.wallet.classicAddress,
        Domain: convertStringToHex('example.com'),
      }
      const { tx_blob: signedAccountSet } = testContext.wallet.sign(
        await testContext.client.autofill(accountSet),
      )
      const responsePromise = testContext.client.submitAndWait(signedAccountSet)
      const ledgerPromise = setTimeout(ledgerAccept, 5000, testContext.client)
      return Promise.all([responsePromise, ledgerPromise]).then(
        ([response, _ledger]) => {
          assert.equal(response.type, 'response')
          assert.equal(response.result.validated, true)
        },
      )
    },
    TIMEOUT,
  )
})
