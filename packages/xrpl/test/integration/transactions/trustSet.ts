import _ from 'lodash'
import { TrustSet, percentToQuality } from 'xrpl-local'

import serverUrl from '../serverUrl'
import { setupClient, teardownClient } from '../setup'
import { generateFundedWallet, testTransaction } from '../utils'

// how long before each test case times out
const TIMEOUT = 20000

describe('TrustSet', function () {
  this.timeout(TIMEOUT)

  beforeEach(_.partial(setupClient, serverUrl))
  afterEach(teardownClient)

  it('base', async function () {
    const wallet2 = await generateFundedWallet(this.client)
    const tx: TrustSet = {
      TransactionType: 'TrustSet',
      Account: this.wallet.classicAddress,
      LimitAmount: {
        currency: 'USD',
        issuer: wallet2.classicAddress,
        value: '100',
      },
    }

    await testTransaction(this.client, tx, this.wallet)
  })

  it('Quality < 1', async function () {
    const wallet2 = await generateFundedWallet(this.client)
    const tx: TrustSet = {
      TransactionType: 'TrustSet',
      Account: this.wallet.address,
      QualityIn: percentToQuality('99%'),
      QualityOut: percentToQuality('99%'),
      LimitAmount: {
        currency: 'USD',
        issuer: wallet2.address,
        value: '100',
      },
    }

    await testTransaction(this.client, tx, this.wallet)
  })

  it('Quality > 1', async function () {
    const wallet2 = await generateFundedWallet(this.client)
    const tx: TrustSet = {
      TransactionType: 'TrustSet',
      QualityIn: percentToQuality('101%'),
      QualityOut: percentToQuality('101%'),
      Account: this.wallet.address,
      LimitAmount: {
        currency: 'USD',
        issuer: wallet2.address,
        value: '100',
      },
    }

    await testTransaction(this.client, tx, this.wallet)
  })
})
