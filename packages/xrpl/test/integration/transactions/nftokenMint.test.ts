/* eslint-disable @typescript-eslint/restrict-template-expressions */
import { assert } from 'chai'
import _ from 'lodash'
import { TransactionMetadata } from 'xrpl'
import {
  Client,
  convertStringToHex,
  getNFTokenID,
  NFTokenMint,
} from 'xrpl-local'

import serverUrl from '../serverUrl'
import { setupClient, teardownClient } from '../setup'
import { testTransaction } from '../utils'

// how long before each test case times out
const TIMEOUT = 20000

describe.only('NFTokenMint', function () {
  this.timeout(TIMEOUT)

  beforeEach(_.partial(setupClient, serverUrl))
  afterEach(teardownClient)

  it('base', async function () {
    const client = new Client('wss://s.altnet.rippletest.net:51233/')
    await client.connect()

    const { wallet, balance: _balance } = await client.fundWallet()

    const tx: NFTokenMint = {
      TransactionType: 'NFTokenMint',
      Account: wallet.address,
      URI: convertStringToHex('https://www.google.com'),
      NFTokenTaxon: 0,
    }
    try {
      await testTransaction(client, tx, wallet, false)
    } finally {
      await client.disconnect()
    }
  })

  it('get NFTokenID', async function () {
    const client = new Client('wss://s.altnet.rippletest.net:51233/')
    await client.connect()

    const { wallet, balance: _balance } = await client.fundWallet()

    const tx: NFTokenMint = {
      TransactionType: 'NFTokenMint',
      Account: wallet.address,
      URI: convertStringToHex('https://www.google.com'),
      NFTokenTaxon: 0,
    }
    try {
      const response = await client.submitAndWait(tx, { wallet })
      assert.equal(response.type, 'response')
      assert.equal(
        (response.result.meta as TransactionMetadata).TransactionResult,
        'tesSUCCESS',
      )

      const accountNFTs = await client.request({
        command: 'account_nfts',
        account: wallet.address,
      })

      const nftokenID =
        getNFTokenID(response.result.meta as TransactionMetadata) ?? 'undefined'
      const accountHasNFT = accountNFTs.result.account_nfts.some(
        (value) => value.NFTokenID === nftokenID,
      )

      assert.isTrue(
        accountHasNFT,
        `Expected to find an NFT with NFTokenID ${nftokenID} from ${
          wallet.address
        }, but did not find it. Here's what was returned from 'account_nfts' for that account: ${JSON.stringify(
          accountNFTs,
        )}`,
      )
    } finally {
      await client.disconnect()
    }
  })
})
