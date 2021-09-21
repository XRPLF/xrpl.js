import { assert } from 'chai'
import _ from 'lodash'

import { OfferCreate } from 'xrpl-local'

import serverUrl from '../serverUrl'
import { setupClient, suiteClientSetup, teardownClient } from '../setup'
import { testTransaction } from '../utils'

// how long before each test case times out
const TIMEOUT = 20000

describe('OfferCreate', function () {
  this.timeout(TIMEOUT)

  before(suiteClientSetup)
  beforeEach(_.partial(setupClient, serverUrl))
  afterEach(teardownClient)

  it('base', async function () {
    const tx: OfferCreate = {
      TransactionType: 'OfferCreate',
      Account: this.wallet.getClassicAddress(),
      TakerGets: '13100000',
      TakerPays: {
        currency: 'USD',
        issuer: this.wallet.getClassicAddress(),
        value: '10',
      },
    }

    await testTransaction(this.client, tx, this.wallet)

    // confirm that the offer actually went through
    const accountOffersResponse = await this.client.request({
      command: 'account_offers',
      account: this.wallet.getClassicAddress(),
    })
    assert.lengthOf(
      accountOffersResponse.result.offers,
      1,
      'Should be exactly one offer on the ledger',
    )
  })
})
