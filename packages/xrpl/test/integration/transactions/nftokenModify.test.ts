import { assert } from 'chai'

import {
  NFTokenModify,
  NFTokenMintFlags,
  convertStringToHex,
  getNFTokenID,
  NFTokenMint,
  TransactionMetadata,
  TxRequest,
} from '../../../src'
import { hashSignedTx } from '../../../src/utils/hashes'
import serverUrl from '../serverUrl'
import {
  setupClient,
  teardownClient,
  type XrplIntegrationTestContext,
} from '../setup'
import { testTransaction } from '../utils'

// how long before each test case times out
const TIMEOUT = 20000

describe('NFTokenModify', function () {
  let testContext: XrplIntegrationTestContext

  beforeEach(async () => {
    testContext = await setupClient(serverUrl)
  })
  afterEach(async () => teardownClient(testContext))

  // Mint an NFToken with tfMutable flag and modify URI later
  it(
    'modify NFToken URI',
    async function () {
      const oldUri = convertStringToHex('https://www.google.com')
      const newUri = convertStringToHex('https://www.youtube.com')

      const mutableMint: NFTokenMint = {
        TransactionType: 'NFTokenMint',
        Account: testContext.wallet.address,
        Flags: NFTokenMintFlags.tfMutable,
        URI: oldUri,
        NFTokenTaxon: 0,
      }
      const response = await testTransaction(
        testContext.client,
        mutableMint,
        testContext.wallet,
      )
      assert.equal(response.type, 'response')

      const mutableTx: TxRequest = {
        command: 'tx',
        transaction: hashSignedTx(response.result.tx_blob),
      }
      const mutableTxResponse = await testContext.client.request(mutableTx)

      const mutableNFTokenID =
        getNFTokenID(
          mutableTxResponse.result.meta as TransactionMetadata<NFTokenMint>,
        ) ?? 'undefined'

      const accountNFTs = await testContext.client.request({
        command: 'account_nfts',
        account: testContext.wallet.address,
      })

      assert.equal(
        accountNFTs.result.account_nfts.find(
          (nft) => nft.NFTokenID === mutableNFTokenID,
        )?.URI,
        oldUri,
      )

      const modifyTx: NFTokenModify = {
        TransactionType: 'NFTokenModify',
        Account: testContext.wallet.address,
        NFTokenID: mutableNFTokenID,
        URI: newUri,
      }

      const modifyResponse = await testTransaction(
        testContext.client,
        modifyTx,
        testContext.wallet,
      )
      assert.equal(modifyResponse.type, 'response')

      const nfts = await testContext.client.request({
        command: 'account_nfts',
        account: testContext.wallet.address,
      })

      assert.equal(
        nfts.result.account_nfts.find(
          (nft) => nft.NFTokenID === mutableNFTokenID,
        )?.URI,
        newUri,
      )
    },
    TIMEOUT,
  )
})
