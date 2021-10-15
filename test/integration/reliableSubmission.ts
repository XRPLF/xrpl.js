/* eslint-disable @typescript-eslint/no-misused-promises -- supposed to return a promise here */
/* eslint-disable no-restricted-syntax -- not sure why this rule is here, definitely not needed here */
import { assert } from 'chai'
import _ from 'lodash'

import { AccountSet, convertStringToHex } from 'xrpl-local'

import serverUrl from './serverUrl'
import { setupClient, teardownClient } from './setup'
import { ledgerAccept } from './utils'

// how long before each test case times out
const TIMEOUT = 60000

describe('reliable submission', function () {
  this.timeout(TIMEOUT)

  beforeEach(_.partial(setupClient, serverUrl))
  afterEach(teardownClient)

  it('submitReliable', async function () {
    const accountSet: AccountSet = {
      TransactionType: 'AccountSet',
      Account: this.wallet.getClassicAddress(),
      Domain: convertStringToHex('example.com'),
    }
    const responsePromise = this.client.submitReliable(this.wallet, accountSet)
    const ledgerPromise = setTimeout(ledgerAccept, 1000, this.client)
    return Promise.all([responsePromise, ledgerPromise]).then(
      ([response, _ledger]) => {
        assert.equal(response.type, 'response')
        assert.equal(response.result.validated, true)
      },
    )
  })

  it('submitSignedReliable', async function () {
    const accountSet: AccountSet = {
      TransactionType: 'AccountSet',
      Account: this.wallet.getClassicAddress(),
      Domain: convertStringToHex('example.com'),
    }
    const { tx_blob: signedAccountSet } = this.wallet.sign(
      await this.client.autofill(accountSet),
    )
    const responsePromise = this.client.submitSignedReliable(signedAccountSet)
    const ledgerPromise = setTimeout(ledgerAccept, 1000, this.client)
    return Promise.all([responsePromise, ledgerPromise]).then(
      ([response, _ledger]) => {
        assert.equal(response.type, 'response')
        assert.equal(response.result.validated, true)
      },
    )
  })

  it('submitSignedReliable longer', async function () {
    const accountSet: AccountSet = {
      TransactionType: 'AccountSet',
      Account: this.wallet.getClassicAddress(),
      Domain: convertStringToHex('example.com'),
    }
    const { tx_blob: signedAccountSet } = this.wallet.sign(
      await this.client.autofill(accountSet),
    )
    const responsePromise = this.client.submitSignedReliable(signedAccountSet)
    const ledgerPromise = setTimeout(ledgerAccept, 5000, this.client)
    return Promise.all([responsePromise, ledgerPromise]).then(
      ([response, _ledger]) => {
        assert.equal(response.type, 'response')
        assert.equal(response.result.validated, true)
      },
    )
  })
})
