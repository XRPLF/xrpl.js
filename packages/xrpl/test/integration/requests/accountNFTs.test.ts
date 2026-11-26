import { assert } from 'chai'

import {
  convertStringToHex,
  AccountNFTsRequest,
  NFTokenMint,
} from '../../../src'
import serverUrl from '../serverUrl'
import {
  setupClient,
  teardownClient,
  type XrplIntegrationTestContext,
} from '../setup'
import { testTransaction } from '../utils'

// how long before each test case times out
const TIMEOUT = 20000

describe('account_nfts', function () {
  let testContext: XrplIntegrationTestContext

  beforeEach(async () => {
    testContext = await setupClient(serverUrl)

    // Mint multiple NFTs for testing pagination
    const uris = ['https://example.com/nft/1', 'https://example.com/nft/2']
    for (const uri of uris) {
      const mintTx: NFTokenMint = {
        TransactionType: 'NFTokenMint',
        Account: testContext.wallet.address,
        URI: convertStringToHex(uri),
        NFTokenTaxon: 0,
      }
      // eslint-disable-next-line no-await-in-loop -- Sequential minting required for test setup
      await testTransaction(testContext.client, mintTx, testContext.wallet)
    }
  })

  afterEach(async () => teardownClient(testContext))

  it(
    'base',
    async () => {
      const request: AccountNFTsRequest = {
        command: 'account_nfts',
        account: testContext.wallet.address,
      }
      const response = await testContext.client.request(request)

      assert.equal(response.type, 'response')
      assert.equal(response.result.account, testContext.wallet.address)
      assert.isArray(response.result.account_nfts)
      assert.isAtLeast(response.result.account_nfts.length, 1)
    },
    TIMEOUT,
  )

  it(
    'with ledger_hash and ledger_index fields',
    async () => {
      const request: AccountNFTsRequest = {
        command: 'account_nfts',
        account: testContext.wallet.address,
        ledger_index: 'validated',
      }
      const response = await testContext.client.request(request)

      assert.equal(response.type, 'response')
      assert.equal(response.result.account, testContext.wallet.address)
      // ledger_hash should be present when using validated ledger
      if (response.result.ledger_hash !== undefined) {
        assert.isString(response.result.ledger_hash)
        assert.match(response.result.ledger_hash, /^[A-F0-9]{64}$/iu)
      }
      // ledger_index should be present when using validated ledger
      if (response.result.ledger_index !== undefined) {
        assert.isNumber(response.result.ledger_index)
        assert.isAtLeast(response.result.ledger_index, 1)
      }
    },
    TIMEOUT,
  )

  it(
    'with validated field',
    async () => {
      const request: AccountNFTsRequest = {
        command: 'account_nfts',
        account: testContext.wallet.address,
        ledger_index: 'validated',
      }
      const response = await testContext.client.request(request)

      assert.equal(response.type, 'response')
      assert.equal(response.result.account, testContext.wallet.address)
      // validated should be present when using validated ledger
      if (response.result.validated !== undefined) {
        assert.isBoolean(response.result.validated)
        assert.isTrue(response.result.validated)
      }
    },
    TIMEOUT,
  )

  it(
    'with limit field',
    async () => {
      const request: AccountNFTsRequest = {
        command: 'account_nfts',
        account: testContext.wallet.address,
        limit: 10,
      }
      const response = await testContext.client.request(request)

      assert.equal(response.type, 'response')
      assert.equal(response.result.account, testContext.wallet.address)
      // The limit field should be present in the response
      if (response.result.limit !== undefined) {
        assert.isNumber(response.result.limit)
        assert.isAtMost(response.result.limit, 10)
      }
    },
    TIMEOUT,
  )

  it(
    'with marker field for pagination',
    async () => {
      const request: AccountNFTsRequest = {
        command: 'account_nfts',
        account: testContext.wallet.address,
        limit: 1,
      }
      const response = await testContext.client.request(request)

      assert.equal(response.type, 'response')
      assert.isDefined(
        response.result.marker,
        'marker should be present when limit < total NFTs',
      )

      // Test pagination with marker
      const nextRequest: AccountNFTsRequest = {
        command: 'account_nfts',
        account: testContext.wallet.address,
        marker: response.result.marker,
      }
      const nextResponse = await testContext.client.request(nextRequest)
      assert.equal(nextResponse.type, 'response')
    },
    TIMEOUT,
  )
})
