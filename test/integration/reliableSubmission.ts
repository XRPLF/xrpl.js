/* eslint-disable @typescript-eslint/no-misused-promises -- supposed to return a promise here */
/* eslint-disable no-restricted-syntax -- not sure why this rule is here, definitely not needed here */
import { assert } from 'chai'
import _ from 'lodash'

import { AccountSet, convertStringToHex } from 'xrpl-local'

import serverUrl from './serverUrl'
import { setupClient, suiteClientSetup, teardownClient } from './setup'
import { ledgerAccept } from './utils'
// how long before each test case times out
const TIMEOUT = 60000
// This test is reliant on external networks, and as such may be flaky.
describe('reliable submission', function () {
  this.timeout(TIMEOUT)

  before(suiteClientSetup)
  beforeEach(_.partial(setupClient, serverUrl))
  afterEach(teardownClient)

  it('submitTransactionReliable', async function () {
    const accountSet: AccountSet = {
      TransactionType: 'AccountSet',
      Account: this.wallet.getClassicAddress(),
      Domain: convertStringToHex('example.com'),
    }
    const responsePromise = this.client.submitTransactionReliable(
      this.wallet,
      accountSet,
    )
    const ledgerPromise = setTimeout(ledgerAccept, 1000, this.client)
    return Promise.all([responsePromise, ledgerPromise]).then(
      ([response, _ledger]) => {
        assert.equal(response.type, 'response')
        assert.equal(response.result.validated, true)
      },
    )
  })

  it('submitSignedTransactionReliable', async function () {
    const accountSet: AccountSet = {
      TransactionType: 'AccountSet',
      Account: this.wallet.getClassicAddress(),
      Domain: convertStringToHex('example.com'),
    }
    const signedAccountSet = this.wallet.signTransaction(
      await this.client.autofill(accountSet),
    )
    const responsePromise =
      this.client.submitSignedTransactionReliable(signedAccountSet)
    const ledgerPromise = setTimeout(ledgerAccept, 1000, this.client)
    return Promise.all([responsePromise, ledgerPromise]).then(
      ([response, _ledger]) => {
        assert.equal(response.type, 'response')
        assert.equal(response.result.validated, true)
      },
    )
  })

  it('submitSignedTransactionReliable longer', async function () {
    const accountSet: AccountSet = {
      TransactionType: 'AccountSet',
      Account: this.wallet.getClassicAddress(),
      Domain: convertStringToHex('example.com'),
    }
    const signedAccountSet = this.wallet.signTransaction(
      await this.client.autofill(accountSet),
    )
    const responsePromise =
      this.client.submitSignedTransactionReliable(signedAccountSet)
    const ledgerPromise = setTimeout(ledgerAccept, 5000, this.client)
    return Promise.all([responsePromise, ledgerPromise]).then(
      ([response, _ledger]) => {
        assert.equal(response.type, 'response')
        assert.equal(response.result.validated, true)
      },
    )
  })
})
