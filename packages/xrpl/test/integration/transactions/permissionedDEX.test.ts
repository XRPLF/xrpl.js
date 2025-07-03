import { stringToHex } from '@xrplf/isomorphic/utils'
import { assert } from 'chai'

import {
  PermissionedDomainSet,
  AuthorizeCredential,
  Wallet,
  IssuedCurrencyAmount,
} from '../../../src'
import DirectoryNode from '../../../src/models/ledger/DirectoryNode'
import Offer from '../../../src/models/ledger/Offer'
import PermissionedDomain from '../../../src/models/ledger/PermissionedDomain'
import {
  BookOffersRequest,
  BookOffersResponse,
} from '../../../src/models/methods/bookOffers'
import { SubmitResponse } from '../../../src/models/methods/submit'
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
  let pd_ledger_object: PermissionedDomain
  let offerCreateTxResponse: SubmitResponse
  let offer_ledger_object: Offer

  beforeAll(async () => {
    // this section describes the pre-requisites for testing PermissionedDEX features
    testContext = await setupClient(serverUrl)
    wallet1 = await generateFundedWallet(testContext.client)
    wallet2 = await generateFundedWallet(testContext.client)

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

    pd_ledger_object = result.result.account_objects[0] as PermissionedDomain

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
        DomainID: pd_ledger_object.index,
      } as OfferCreate,
      wallet1,
    )
  })

  afterAll(async () => teardownClient(testContext))

  it(
    'Validate the domainID of the Offer ledger object',
    async () => {
      offer_ledger_object = (
        await testContext.client.request({
          command: 'ledger_entry',
          offer: {
            account: wallet1.classicAddress,
            seq: offerCreateTxResponse.result.tx_json.Sequence as number,
          },
        })
      ).result.node as Offer

      assert.equal(offer_ledger_object.LedgerEntryType, 'Offer')
      assert.equal(offer_ledger_object.DomainID, pd_ledger_object.index)
      assert.equal(offer_ledger_object.Account, wallet1.classicAddress)
      assert.isNotNull(offer_ledger_object.AdditionalBooks)
    },
    TIMEOUT,
  )

  it(
    'Validate the properties of the DirectoryNode ledger object (contains the PermissionedDEX Offer object)',
    async () => {
      const directoryNode_ledger_object = await testContext.client.request({
        command: 'ledger_entry',
        directory: offer_ledger_object.BookDirectory,
      })

      assert.equal(
        (directoryNode_ledger_object.result.node as DirectoryNode).index,
        offer_ledger_object.BookDirectory,
      )
      assert.equal(
        (directoryNode_ledger_object.result.node as DirectoryNode)
          .LedgerEntryType,
        'DirectoryNode',
      )
      assert.equal(
        (directoryNode_ledger_object.result.node as DirectoryNode).DomainID,
        pd_ledger_object.index,
      )
    },
    TIMEOUT,
  )

  it(`Validate the bookOffers method`, async () => {
    const response: BookOffersResponse = await testContext.client.request({
      command: 'book_offers',
      taker: wallet2.classicAddress,
      taker_pays: {
        currency: 'USD',
        issuer: testContext.wallet.classicAddress,
      },
      taker_gets: {
        currency: 'XRP',
      },
      domain: pd_ledger_object.index,
    } as BookOffersRequest)

    assert.equal(response.result.offers.length, 1)
    assert.equal(response.result.offers[0].TakerGets, '1000')
    assert.equal(
      (response.result.offers[0].TakerPays as IssuedCurrencyAmount).value,
      '10',
    )
    assert.equal(
      (response.result.offers[0].TakerPays as IssuedCurrencyAmount).currency,
      'USD',
    )
    assert.equal(
      (response.result.offers[0].TakerPays as IssuedCurrencyAmount).issuer,
      testContext.wallet.classicAddress,
    )

    assert.equal(response.result.offers[0].DomainID, pd_ledger_object.index)
  })

  it(
    'Crossing a PermissionedDEX Offer with a Payment transaction',
    async () => {
      // wallet2 "crosses" the offer with a Payment transaction within the domain
      const paymentTx: Payment = {
        TransactionType: 'Payment',
        Account: wallet2.classicAddress,
        Amount: '10',
        Destination: wallet1.classicAddress,
        DomainID: pd_ledger_object.index,
      }

      await testTransaction(testContext.client, paymentTx, wallet2)
    },
    TIMEOUT,
  )
})
