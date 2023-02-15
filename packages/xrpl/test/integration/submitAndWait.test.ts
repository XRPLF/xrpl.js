import { assert } from 'chai'

import { AccountSet, convertStringToHex, ValidationError } from '../../src'
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

describe('client.submitAndWait', function () {
  let testContext: XrplIntegrationTestContext

  beforeEach(async () => {
    testContext = await setupClient(serverUrl)
  })
  afterEach(async () => teardownClient(testContext))

  async function delayedLedgerAccept(): Promise<unknown> {
    await new Promise<void>((resolve) => {
      setTimeout(resolve, 1000)
    })
    return ledgerAccept(testContext.client)
  }

  it(
    'submitAndWait an unsigned transaction',
    async () => {
      const accountSet: AccountSet = {
        TransactionType: 'AccountSet',
        Account: testContext.wallet.classicAddress,
        Domain: convertStringToHex('example.com'),
      }

      let retries = 10

      while (retries > 0) {
        retries -= 1
        const responsePromise = testContext.client.submitAndWait(accountSet, {
          wallet: testContext.wallet,
        })
        const ledgerPromise = delayedLedgerAccept()

        try {
          // eslint-disable-next-line no-await-in-loop -- Testing purposes
          const [response, _ledger] = await Promise.all([
            responsePromise,
            ledgerPromise,
          ])

          assert.equal(response.type, 'response')
          assert.equal(response.result.validated, true)
          retries = 0
          break
        } catch (err) {
          // eslint-disable-next-line max-depth -- Necessary
          if (!(err instanceof Error)) {
            throw err
          }
          const errorCodeRegex = /(?:Preliminary result:\s)(?<errorCode>.*)$/gu
          const message = err.message
          const matches = errorCodeRegex.exec(message)
          const errorCode = matches?.groups?.errorCode

          // Retry if another transaction finished before this one
          // eslint-disable-next-line max-depth -- Testing
          if (['tefPAST_SEQ', 'tefMAX_LEDGER'].includes(errorCode || '')) {
            // eslint-disable-next-line no-await-in-loop, no-promise-executor-return -- We are waiting on retries
            await new Promise((resolve) => setTimeout(resolve, 1000))
          } else {
            retries = 0
            break
          }
        }
      }
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
      const ledgerPromise = delayedLedgerAccept()
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
      const ledgerPromise = delayedLedgerAccept()
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
