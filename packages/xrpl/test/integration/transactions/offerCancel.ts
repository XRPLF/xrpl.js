import { assert } from 'chai'
import _ from 'lodash'
import { OfferCreate, OfferCancel } from 'xrpl-local'

import serverUrl from '../serverUrl'
import { setupClient, teardownClient } from '../setup'
import { testTransaction } from '../utils'

// how long before each test case times out
const TIMEOUT = 20000

describe('OfferCancel', function () {
  this.timeout(TIMEOUT)

  beforeEach(_.partial(setupClient, serverUrl))
  afterEach(teardownClient)

  it('base', async function () {
    // set up an offer
    const setupTx: OfferCreate = {
      TransactionType: 'OfferCreate',
      Account: this.wallet.classicAddress,
      TakerGets: '13100000',
      TakerPays: {
        currency: 'USD',
        issuer: this.wallet.classicAddress,
        value: '10',
      },
    }

    await testTransaction(this.client, setupTx, this.wallet)

    const accountOffersResponse = await this.client.request({
      command: 'account_offers',
      account: this.wallet.classicAddress,
    })
    assert.lengthOf(
      accountOffersResponse.result.offers,
      1,
      'Should be exactly one offer on the ledger',
    )
    const seq = accountOffersResponse.result.offers[0].seq

    // actually test OfferCancel
    const tx: OfferCancel = {
      TransactionType: 'OfferCancel',
      Account: this.wallet.classicAddress,
      OfferSequence: seq,
    }

    await testTransaction(this.client, tx, this.wallet)

    const accountOffersResponse2 = await this.client.request({
      command: 'account_offers',
      account: this.wallet.classicAddress,
    })
    assert.lengthOf(
      accountOffersResponse2.result.offers,
      0,
      'Should not be any offers on the ledger',
    )
  })
})
