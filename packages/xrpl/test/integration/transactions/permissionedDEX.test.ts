import { stringToHex } from '@xrplf/isomorphic/utils'
import { assert } from 'chai'

import {
  PermissionedDomainSet,
  AuthorizeCredential,
  Wallet,
  IssuedCurrencyAmount,
  AccountSetAsfFlags,
} from '../../../src'
import DirectoryNode from '../../../src/models/ledger/DirectoryNode'
import Offer from '../../../src/models/ledger/Offer'
import PermissionedDomain from '../../../src/models/ledger/PermissionedDomain'
import {
  BookOffersRequest,
  BookOffersResponse,
} from '../../../src/models/methods/bookOffers'
import { SubmitResponse } from '../../../src/models/methods/submit'
import {
  SubscribeBook,
  SubscribeRequest,
} from '../../../src/models/methods/subscribe'
import { CredentialAccept } from '../../../src/models/transactions/CredentialAccept'
import { CredentialCreate } from '../../../src/models/transactions/CredentialCreate'
import {
  OfferCreate,
  OfferCreateFlags,
} from '../../../src/models/transactions/offerCreate'
import { Payment } from '../../../src/models/transactions/payment'
import serverUrl from '../serverUrl'
import {
  setupClient,
  teardownClient,
  type XrplIntegrationTestContext,
} from '../setup'
import { generateFundedWallet, testTransaction } from '../utils'

// how long before each test case times out
const TIMEOUT = 20000

describe('PermissionedDEX', function () {
  let testContext: XrplIntegrationTestContext
  let wallet1: Wallet
  let wallet2: Wallet
  let permDomainLedgerObject: PermissionedDomain
  let offerCreateTxResponse: SubmitResponse
  let offerLedgerObject: Offer

  beforeAll(async () => {
    // this section describes the pre-requisites for testing PermissionedDEX features
    testContext = await setupClient(serverUrl)
    wallet1 = await generateFundedWallet(testContext.client)
    wallet2 = await generateFundedWallet(testContext.client)

    // set the default ripple flag on the issuer's wallet
    await testTransaction(
      testContext.client,
      {
        TransactionType: 'AccountSet',
        Account: testContext.wallet.classicAddress,
        SetFlag: AccountSetAsfFlags.asfDefaultRipple,
      },
      testContext.wallet,
    )

    // Create a Credential from the issuer's wallet into Wallet1
    await testTransaction(
      testContext.client,
      {
        TransactionType: 'CredentialCreate',
        Subject: wallet1.classicAddress,
        Account: testContext.wallet.classicAddress,
        CredentialType: stringToHex('Passport'),
      } as CredentialCreate,
      testContext.wallet,
    )

    // Create a Credential from the issuer's wallet into Wallet2
    await testTransaction(
      testContext.client,
      {
        TransactionType: 'CredentialCreate',
        Subject: wallet2.classicAddress,
        Account: testContext.wallet.classicAddress,
        CredentialType: stringToHex('Passport'),
      } as CredentialCreate,
      testContext.wallet,
    )

    // Create a Permissioned Domain ledger object
    await testTransaction(
      testContext.client,
      {
        TransactionType: 'PermissionedDomainSet',
        Account: testContext.wallet.classicAddress,
        AcceptedCredentials: [
          {
            Credential: {
              CredentialType: stringToHex('Passport'),
              Issuer: testContext.wallet.classicAddress,
            },
          } as AuthorizeCredential,
        ],
      } as PermissionedDomainSet,
      testContext.wallet,
    )

    // Execute CredentialAccept transactions from wallet1 and wallet2 accounts
    await testTransaction(
      testContext.client,
      {
        TransactionType: 'CredentialAccept',
        Account: wallet1.classicAddress,
        Issuer: testContext.wallet.classicAddress,
        CredentialType: stringToHex('Passport'),
      } as CredentialAccept,
      wallet1,
    )

    await testTransaction(
      testContext.client,
      {
        TransactionType: 'CredentialAccept',
        Account: wallet2.classicAddress,
        Issuer: testContext.wallet.classicAddress,
        CredentialType: stringToHex('Passport'),
      } as CredentialAccept,
      wallet2,
    )
    // fetch the domainID from the of the PermissionedDomain ledger object
    const result = await testContext.client.request({
      command: 'account_objects',
      account: testContext.wallet.classicAddress,
      type: 'permissioned_domain',
    })

    permDomainLedgerObject = result.result
      .account_objects[0] as PermissionedDomain

    // wallet1 establishes a trust line for USD IOU Token
    await testTransaction(
      testContext.client,
      {
        TransactionType: 'TrustSet',
        Account: wallet1.classicAddress,
        LimitAmount: {
          currency: 'USD',
          issuer: testContext.wallet.classicAddress,
          value: '10000',
        },
      },
      wallet1,
    )

    // wallet2 establishes a trust line for USD IOU Token
    await testTransaction(
      testContext.client,
      {
        TransactionType: 'TrustSet',
        Account: wallet2.classicAddress,
        LimitAmount: {
          currency: 'USD',
          issuer: testContext.wallet.classicAddress,
          value: '10000',
        },
      },
      wallet2,
    )

    // Ensure sufficient USD Token funds are available in wallet1 and wallet2
    await testTransaction(
      testContext.client,
      {
        TransactionType: 'Payment',
        Account: testContext.wallet.classicAddress,
        Amount: {
          currency: 'USD',
          issuer: testContext.wallet.classicAddress,
          value: '10000',
        },
        Destination: wallet1.classicAddress,
      } as Payment,
      testContext.wallet,
    )

    await testTransaction(
      testContext.client,
      {
        TransactionType: 'Payment',
        Account: testContext.wallet.classicAddress,
        Amount: {
          currency: 'USD',
          issuer: testContext.wallet.classicAddress,
          value: '10000',
        },
        Destination: wallet2.classicAddress,
      } as Payment,
      testContext.wallet,
    )

    // Execute an OfferCreate transaction to create a hybrid offer
    offerCreateTxResponse = await testTransaction(
      testContext.client,
      {
        TransactionType: 'OfferCreate',
        Account: wallet1.classicAddress,
        TakerGets: '1000',
        TakerPays: {
          currency: 'USD',
          issuer: testContext.wallet.classicAddress,
          value: '10',
        },
        Flags: OfferCreateFlags.tfHybrid,
        DomainID: permDomainLedgerObject.index,
      } as OfferCreate,
      wallet1,
    )
  })

  afterAll(async () => teardownClient(testContext))

  it(
    'Validate characteristics of the PermissionedDEX Offer',
    // eslint-disable-next-line max-statements -- this feature is complex and requires multiple assertions
    async () => {
      // Validate the domainID of the Offer ledger object
      offerLedgerObject = (
        await testContext.client.request({
          command: 'ledger_entry',
          offer: {
            account: wallet1.classicAddress,
            seq: offerCreateTxResponse.result.tx_json.Sequence as number,
          },
        })
      ).result.node as Offer

      assert.equal(offerLedgerObject.LedgerEntryType, 'Offer')
      assert.equal(offerLedgerObject.DomainID, permDomainLedgerObject.index)
      assert.equal(offerLedgerObject.Account, wallet1.classicAddress)

      // Validate the contents and structure of the AdditionalBooks field
      assert.isNotNull(offerLedgerObject.AdditionalBooks)
      assert.equal(offerLedgerObject.AdditionalBooks?.length, 1)
      assert.isNotNull(offerLedgerObject.AdditionalBooks?.[0].Book.BookNode)

      assert.isNotNull(
        offerLedgerObject.AdditionalBooks?.[0].Book.BookDirectory,
      )
      // The book directory of the open-book is different from the book directory of the in-domain offer
      assert.notEqual(
        offerLedgerObject.AdditionalBooks?.[0].Book.BookDirectory,
        offerLedgerObject.BookDirectory,
      )

      // Validate the properties of the DirectoryNode ledger object (contains the PermissionedDEX Offer object)
      const ledgerEntryResponse = await testContext.client.request({
        command: 'ledger_entry',
        directory: offerLedgerObject.BookDirectory,
      })

      assert.equal(
        (ledgerEntryResponse.result.node as DirectoryNode).index,
        offerLedgerObject.BookDirectory,
      )
      assert.equal(
        (ledgerEntryResponse.result.node as DirectoryNode).LedgerEntryType,
        'DirectoryNode',
      )
      assert.equal(
        (ledgerEntryResponse.result.node as DirectoryNode).DomainID,
        permDomainLedgerObject.index,
      )

      // Validate the bookOffers method
      const bookOffersResponse: BookOffersResponse =
        await testContext.client.request({
          command: 'book_offers',
          taker: wallet2.classicAddress,
          taker_pays: {
            currency: 'USD',
            issuer: testContext.wallet.classicAddress,
          },
          taker_gets: {
            currency: 'XRP',
          },
          domain: permDomainLedgerObject.index,
        } as BookOffersRequest)

      assert.equal(bookOffersResponse.result.offers.length, 1)
      assert.equal(bookOffersResponse.result.offers[0].TakerGets, '1000')
      assert.equal(
        (bookOffersResponse.result.offers[0].TakerPays as IssuedCurrencyAmount)
          .value,
        '10',
      )
      assert.equal(
        (bookOffersResponse.result.offers[0].TakerPays as IssuedCurrencyAmount)
          .currency,
        'USD',
      )
      assert.equal(
        (bookOffersResponse.result.offers[0].TakerPays as IssuedCurrencyAmount)
          .issuer,
        testContext.wallet.classicAddress,
      )

      assert.equal(
        bookOffersResponse.result.offers[0].DomainID,
        permDomainLedgerObject.index,
      )

      // Validate the subscribe command
      const request: SubscribeRequest = {
        command: 'subscribe',
        books: [
          {
            taker_gets: { currency: 'XRP' },
            taker_pays: {
              currency: 'USD',
              issuer: testContext.wallet.classicAddress,
            },
            taker: wallet1.classicAddress,
            domain: permDomainLedgerObject.index,
          } as SubscribeBook,
        ],
      }

      const response = await testContext.client.request(request)
      assert.equal(response.type, 'response')

      // Note: The result is empty because no Offer has been created after the creation of the Subscription stream.
      // This case is tested in the rippled code. To avoid the additional complexity, validating the contents
      // of the response is skipped in this test.
      // This test validates that domain_id is an acceptable input parameter to the subscribe command.
      assert.isEmpty(response.result)

      // Validate the "crossing" of a PermissionedDEX Offer
      // wallet2 "crosses" the offer within the domain
      const offerCreateTx: OfferCreate = {
        TransactionType: 'OfferCreate',
        Account: wallet2.classicAddress,
        TakerPays: '1000',
        TakerGets: {
          currency: 'USD',
          issuer: testContext.wallet.classicAddress,
          value: '10',
        },
        DomainID: permDomainLedgerObject.index,
      }

      await testTransaction(testContext.client, offerCreateTx, wallet2)

      // Validate that Offer ledger objects are consumed in both wallets
      const wallet1Objects = await testContext.client.request({
        command: 'account_objects',
        account: wallet1.classicAddress,
        type: 'offer',
      })
      assert.isEmpty(wallet1Objects.result.account_objects)

      const wallet2Objects = await testContext.client.request({
        command: 'account_objects',
        account: wallet2.classicAddress,
        type: 'offer',
      })
      assert.isEmpty(wallet2Objects.result.account_objects)
    },
    TIMEOUT,
  )
})
