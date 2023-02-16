import { assert } from 'chai'
import _ from 'lodash'

import {
  Client,
  convertStringToHex,
  getNFTokenID,
  NFTokenMint,
  TransactionMetadata,
} from '../../../src'
import serverUrl from '../serverUrl'
import {
  setupClient,
  teardownClient,
  XrplIntegrationTestContext,
} from '../setup'

// how long before each test case times out
const TIMEOUT = 20000

describe('NFTokenMint', function () {
  let testContext: XrplIntegrationTestContext

  beforeEach(async () => {
    testContext = await setupClient('wss://s.altnet.rippletest.net:51233/')
  })
  afterEach(async () => teardownClient(testContext))

  it(
    'get NFTokenID',
    async function () {
      const tx: NFTokenMint = {
        TransactionType: 'NFTokenMint',
        Account: testContext.wallet.address,
        URI: convertStringToHex('https://www.google.com'),
        NFTokenTaxon: 0,
      }
      try {
        const response = await testContext.client.submitAndWait(tx, {
          wallet: testContext.wallet,
        })
        assert.equal(response.type, 'response')
        assert.equal(
          (response.result.meta as TransactionMetadata).TransactionResult,
          'tesSUCCESS',
        )

        const accountNFTs = await testContext.client.request({
          command: 'account_nfts',
          account: testContext.wallet.address,
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
            testContext.wallet.address
          } but did not find it.
        \n\nHere's what was returned from 'account_nfts' for ${
          testContext.wallet.address
        }: ${JSON.stringify(accountNFTs)}`,
        )
      } finally {
        await testContext.client.disconnect()
      }
    },
    TIMEOUT,
  )
})
