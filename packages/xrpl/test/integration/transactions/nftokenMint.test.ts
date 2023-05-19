import { assert } from 'chai'
import _ from 'lodash'
import { Client } from 'xrpl'

import {
  convertStringToHex,
  getNFTokenID,
  NFTokenMint,
  TransactionMetadata,
} from '../../../src'

// how long before each test case times out
const TIMEOUT = 20000

describe('NFTokenMint', function () {
  // TODO: Once we update our integration tests to handle NFTs, replace this client with XrplIntegrationTestContext
  it(
    'get NFTokenID',
    async function () {
      const client = new Client('wss://s.altnet.rippletest.net:51233/')
      await client.connect()

      const { wallet, balance: _balance } = await client.fundWallet(null, {
        usageContext: 'integration-test',
      })

      const tx: NFTokenMint = {
        TransactionType: 'NFTokenMint',
        Account: wallet.address,
        URI: convertStringToHex('https://www.google.com'),
        NFTokenTaxon: 0,
      }
      try {
        const response = await client.submitAndWait(tx, {
          wallet,
        })
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
          getNFTokenID(response.result.meta as TransactionMetadata) ??
          'undefined'
        const accountHasNFT = accountNFTs.result.account_nfts.some(
          (value) => value.NFTokenID === nftokenID,
        )

        assert.isTrue(
          accountHasNFT,
          `Expected to find an NFT with NFTokenID ${nftokenID} in account ${
            wallet.address
          } but did not find it.
        \n\nHere's what was returned from 'account_nfts' for ${
          wallet.address
        }: ${JSON.stringify(accountNFTs)}`,
        )
      } finally {
        await client.disconnect()
      }
    },
    TIMEOUT,
  )
})
