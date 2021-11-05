/* eslint-disable @typescript-eslint/no-misused-promises -- supposed to return a promise here */
/* eslint-disable no-restricted-syntax -- not sure why this rule is here, definitely not needed here */
import { assert } from 'chai'
import _ from 'lodash'

import { AccountSet, convertStringToHex, ValidationError } from 'xrpl-local'

import { assertRejects } from '../testUtils'

import serverUrl from './serverUrl'
import { setupClient, teardownClient } from './setup'
import { ledgerAccept } from './utils'

// how long before each test case times out
const TIMEOUT = 60000

describe('client.submitAndWait', function () {
  this.timeout(TIMEOUT)

  beforeEach(_.partial(setupClient, serverUrl))
  afterEach(teardownClient)

  it('submitAndWait an unsigned transaction', async function () {
    const accountSet: AccountSet = {
      TransactionType: 'AccountSet',
      Account: this.wallet.classicAddress,
      Domain: convertStringToHex('example.com'),
    }
    const responsePromise = this.client.submitAndWait(accountSet, {
      wallet: this.wallet,
    })
    const ledgerPromise = setTimeout(ledgerAccept, 1000, this.client)
    return Promise.all([responsePromise, ledgerPromise]).then(
      ([response, _ledger]) => {
        assert.equal(response.type, 'response')
        assert.equal(response.result.validated, true)
      },
    )
  })

  it('should throw a ValidationError when submitting an unsigned transaction without a wallet', async function () {
    const accountSet: AccountSet = {
      TransactionType: 'AccountSet',
      Account: this.wallet.classicAddress,
      Domain: convertStringToHex('example.com'),
    }

    await assertRejects(
      this.client.submitAndWait(accountSet),
      ValidationError,
      'Wallet must be provided when submitting an unsigned transaction',
    )
  })

  it('submitAndWait a signed transaction', async function () {
    const accountSet: AccountSet = {
      TransactionType: 'AccountSet',
      Account: this.wallet.classicAddress,
      Domain: convertStringToHex('example.com'),
    }
    const { tx_blob: signedAccountSet } = this.wallet.sign(
      await this.client.autofill(accountSet),
    )
    const responsePromise = this.client.submitAndWait(signedAccountSet)
    const ledgerPromise = setTimeout(ledgerAccept, 1000, this.client)
    return Promise.all([responsePromise, ledgerPromise]).then(
      ([response, _ledger]) => {
        assert.equal(response.type, 'response')
        assert.equal(response.result.validated, true)
      },
    )
  })

  it('submitAndWait a signed transaction longer', async function () {
    const accountSet: AccountSet = {
      TransactionType: 'AccountSet',
      Account: this.wallet.classicAddress,
      Domain: convertStringToHex('example.com'),
    }
    const { tx_blob: signedAccountSet } = this.wallet.sign(
      await this.client.autofill(accountSet),
    )
    const responsePromise = this.client.submitAndWait(signedAccountSet)
    const ledgerPromise = setTimeout(ledgerAccept, 5000, this.client)
    return Promise.all([responsePromise, ledgerPromise]).then(
      ([response, _ledger]) => {
        assert.equal(response.type, 'response')
        assert.equal(response.result.validated, true)
      },
    )
  })
})
