import { assert } from 'chai'

import { OfferFlags } from '../../src/models/ledger/Offer'
import {
  setupClient,
  teardownClient,
  type XrplTestContext,
} from '../setupClient'

const ACCOUNT = 'rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh'
const MIN_QUANTITY = { currency: 'USD', issuer: ACCOUNT, value: '10' }

// OfferQualifiers adds `all_or_none` and `min_quantity` to each offer of
// account_offers (AccountOffers.cpp appendOfferJson) and book_offers
// (NetworkOPs.cpp getBookPage).
describe('OfferQualifiers offer fields', function () {
  let testContext: XrplTestContext

  beforeEach(async () => {
    testContext = await setupClient()
  })
  afterEach(async () => teardownClient(testContext))

  it('account_offers returns all_or_none and min_quantity', async function () {
    testContext.mockRippled!.addResponse('account_offers', {
      id: 0,
      type: 'response',
      status: 'success',
      result: {
        account: ACCOUNT,
        ledger_current_index: 7,
        validated: false,
        offers: [
          {
            flags: OfferFlags.lsfAllOrNone,
            seq: 5,
            taker_gets: { currency: 'USD', issuer: ACCOUNT, value: '100' },
            taker_pays: '1000000',
            quality: '10000',
            all_or_none: true,
            min_quantity: MIN_QUANTITY,
          },
        ],
      },
    })
    const response = await testContext.client.request({
      command: 'account_offers',
      account: ACCOUNT,
    })
    const [offer] = response.result.offers ?? []
    assert.isTrue(offer.all_or_none)
    assert.deepEqual(offer.min_quantity, MIN_QUANTITY)
  })

  it('book_offers returns all_or_none and min_quantity', async function () {
    testContext.mockRippled!.addResponse('book_offers', {
      id: 0,
      type: 'response',
      status: 'success',
      result: {
        ledger_current_index: 7,
        validated: false,
        offers: [
          {
            Account: ACCOUNT,
            BookDirectory:
              'A118405CF7C2C89AB0CC084417187B86870DC14325C861A0470E1AEE5CBE20D9',
            BookNode: '0',
            Flags: OfferFlags.lsfAllOrNone,
            LedgerEntryType: 'Offer',
            MinQuantity: MIN_QUANTITY,
            OwnerNode: '0',
            PreviousTxnID:
              '9DD36CC7338FEB9E501A33EAAA4C00DBE4ED3A692704C62DDBD1848EE1F6E762',
            PreviousTxnLgrSeq: 11,
            Sequence: 5,
            TakerGets: { currency: 'USD', issuer: ACCOUNT, value: '100' },
            TakerPays: '1000000',
            index:
              '5F37226E0A8AB61E4F5F6E5B46D0D86E1B6F6D2C2D8AE0F6B9C5E1A2B3C4D5E6',
            quality: '10000',
            all_or_none: true,
            min_quantity: MIN_QUANTITY,
          },
        ],
      },
    })
    const response = await testContext.client.request({
      command: 'book_offers',
      taker_gets: { currency: 'USD', issuer: ACCOUNT },
      taker_pays: { currency: 'XRP' },
    })
    const offer = response.result.offers[0]
    assert.isTrue(offer.all_or_none)
    assert.deepEqual(offer.min_quantity, MIN_QUANTITY)
    assert.deepEqual(offer.MinQuantity, MIN_QUANTITY)
  })
})
