import { assert } from 'chai'

import { Client } from '../../src/client'
import type Sponsorship from '../../src/models/ledger/Sponsorship'
import { SponsorshipFlags } from '../../src/models/ledger/Sponsorship'
import type { LedgerEntryRequest } from '../../src/models/methods'
import { SponsorFlags } from '../../src/models/transactions/common'
import type { Payment } from '../../src/models/transactions/payment'
import { validatePreFundedSponsorship } from '../../src/sugar/validateSponsorship'
import serverUrl from '../integration/serverUrl'

interface MockRequest {
  command: string
}

interface MockResponse {
  status: string
  type: string
  result: { node: Sponsorship }
}

interface MockRequestFnInterface {
  (req: MockRequest): Promise<MockResponse>
}

describe('validatePreFundedSponsorship', function () {
  let client: Client

  beforeEach(async function () {
    client = new Client(serverUrl)
  })

  afterEach(async function () {
    if (client.isConnected()) {
      await client.disconnect()
    }
  })

  it('rejects transaction without Sponsor field', async function () {
    const tx: Payment = {
      TransactionType: 'Payment',
      Account: 'rN7n7otQDd6FczFgLdlqtyMVrn3HMfXoKk',
      Destination: 'rpZc4mVfWUif9CRoHRKKcmhu1nx2xktxBo',
      Amount: '1000000',
    }

    const result = await validatePreFundedSponsorship(client, tx, '100')

    assert.isFalse(result.valid)
    assert.include(result.error ?? '', 'Sponsor and SponsorFlags')
  })

  it('rejects transaction with SponsorSignature', async function () {
    const tx: Payment = {
      TransactionType: 'Payment',
      Account: 'rN7n7otQDd6FczFgLdlqtyMVrn3HMfXoKk',
      Destination: 'rpZc4mVfWUif9CRoHRKKcmhu1nx2xktxBo',
      Amount: '1000000',
      Sponsor: 'rfkE1aSy9G8Upk4JssnwBxhEv5p4mn2KTy',
      SponsorFlags: SponsorFlags.tfSponsorFee,
      SponsorSignature: {
        SigningPubKey:
          '02FE9932A9C4AA2AC9F0ED0F2B89302DE7C2C95F91D782DA3CF06E64E1C1216449',
        TxnSignature: '3045...',
      },
    }

    const result = await validatePreFundedSponsorship(client, tx, '100')

    assert.isFalse(result.valid)
    assert.include(result.error ?? '', 'pre-funded')
  })

  it('validates reserve-only sponsorship without fee checks', async function () {
    const mockResponse = {
      status: 'success',
      type: 'response',
      result: {
        node: {
          LedgerEntryType: 'Sponsorship',
          Owner: 'rfkE1aSy9G8Upk4JssnwBxhEv5p4mn2KTy',
          Sponsee: 'rN7n7otQDd6FczFgLdlqtyMVrn3HMfXoKk',
          Flags: 0,
        } as Sponsorship,
      },
    }

    // Mock the ledger_entry request
    const originalRequest = client.request.bind(client)
    const mockFn: MockRequestFnInterface = async (req) => {
      if (req.command === 'ledger_entry') {
        return mockResponse
      }
      return originalRequest(req as LedgerEntryRequest)
    }
    client.request = mockFn as typeof client.request

    const tx: Payment = {
      TransactionType: 'Payment',
      Account: 'rN7n7otQDd6FczFgLdlqtyMVrn3HMfXoKk',
      Destination: 'rpZc4mVfWUif9CRoHRKKcmhu1nx2xktxBo',
      Amount: '1000000',
      Sponsor: 'rfkE1aSy9G8Upk4JssnwBxhEv5p4mn2KTy',
      SponsorFlags: SponsorFlags.tfSponsorReserve,
    }

    const result = await validatePreFundedSponsorship(client, tx, '100')

    assert.isTrue(result.valid)
    assert.isDefined(result.sponsorship)
  })

  it('rejects when FeeAmount is insufficient', async function () {
    const mockResponse = {
      status: 'success',
      type: 'response',
      result: {
        node: {
          LedgerEntryType: 'Sponsorship',
          Owner: 'rfkE1aSy9G8Upk4JssnwBxhEv5p4mn2KTy',
          Sponsee: 'rN7n7otQDd6FczFgLdlqtyMVrn3HMfXoKk',
          Flags: 0,
          // Only 50 drops available
          FeeAmount: '50',
        } as Sponsorship,
      },
    }

    const originalRequest = client.request.bind(client)
    const mockFn: MockRequestFnInterface = async (req) => {
      if (req.command === 'ledger_entry') {
        return mockResponse
      }
      return originalRequest(req as LedgerEntryRequest)
    }
    client.request = mockFn as typeof client.request

    const tx: Payment = {
      TransactionType: 'Payment',
      Account: 'rN7n7otQDd6FczFgLdlqtyMVrn3HMfXoKk',
      Destination: 'rpZc4mVfWUif9CRoHRKKcmhu1nx2xktxBo',
      Amount: '1000000',
      Sponsor: 'rfkE1aSy9G8Upk4JssnwBxhEv5p4mn2KTy',
      SponsorFlags: SponsorFlags.tfSponsorFee,
    }

    const result = await validatePreFundedSponsorship(client, tx, '100')

    assert.isFalse(result.valid)
    assert.include(result.error ?? '', 'insufficient')
  })

  it('rejects when MaxFee is exceeded', async function () {
    const mockResponse = {
      status: 'success',
      type: 'response',
      result: {
        node: {
          LedgerEntryType: 'Sponsorship',
          Owner: 'rfkE1aSy9G8Upk4JssnwBxhEv5p4mn2KTy',
          Sponsee: 'rN7n7otQDd6FczFgLdlqtyMVrn3HMfXoKk',
          Flags: 0,
          FeeAmount: '1000000',
          MaxFee: '50',
        } as Sponsorship,
      },
    }

    const originalRequest = client.request.bind(client)
    const mockFn: MockRequestFnInterface = async (req) => {
      if (req.command === 'ledger_entry') {
        return mockResponse
      }
      return originalRequest(req as LedgerEntryRequest)
    }
    client.request = mockFn as typeof client.request

    const tx: Payment = {
      TransactionType: 'Payment',
      Account: 'rN7n7otQDd6FczFgLdlqtyMVrn3HMfXoKk',
      Destination: 'rpZc4mVfWUif9CRoHRKKcmhu1nx2xktxBo',
      Amount: '1000000',
      Sponsor: 'rfkE1aSy9G8Upk4JssnwBxhEv5p4mn2KTy',
      SponsorFlags: SponsorFlags.tfSponsorFee,
    }

    const result = await validatePreFundedSponsorship(client, tx, '100')

    assert.isFalse(result.valid)
    assert.include(result.error ?? '', 'MaxFee')
  })

  it('rejects fee sponsorship when lsfSponsorshipRequireSignForFee is set', async function () {
    const mockResponse = {
      status: 'success',
      type: 'response',
      result: {
        node: {
          LedgerEntryType: 'Sponsorship',
          Owner: 'rfkE1aSy9G8Upk4JssnwBxhEv5p4mn2KTy',
          Sponsee: 'rN7n7otQDd6FczFgLdlqtyMVrn3HMfXoKk',
          Flags: SponsorshipFlags.lsfSponsorshipRequireSignForFee,
          FeeAmount: '1000000',
        } as Sponsorship,
      },
    }

    const originalRequest = client.request.bind(client)
    const mockFn: MockRequestFnInterface = async (req) => {
      if (req.command === 'ledger_entry') {
        return mockResponse
      }
      return originalRequest(req as LedgerEntryRequest)
    }
    client.request = mockFn as typeof client.request

    const tx: Payment = {
      TransactionType: 'Payment',
      Account: 'rN7n7otQDd6FczFgLdlqtyMVrn3HMfXoKk',
      Destination: 'rpZc4mVfWUif9CRoHRKKcmhu1nx2xktxBo',
      Amount: '1000000',
      Sponsor: 'rfkE1aSy9G8Upk4JssnwBxhEv5p4mn2KTy',
      SponsorFlags: SponsorFlags.tfSponsorFee,
    }

    const result = await validatePreFundedSponsorship(client, tx, '100')

    assert.isFalse(result.valid)
    assert.include(result.error ?? '', 'lsfSponsorshipRequireSignForFee')
  })

  it('rejects reserve sponsorship when lsfSponsorshipRequireSignForReserve is set', async function () {
    const mockResponse = {
      status: 'success',
      type: 'response',
      result: {
        node: {
          LedgerEntryType: 'Sponsorship',
          Owner: 'rfkE1aSy9G8Upk4JssnwBxhEv5p4mn2KTy',
          Sponsee: 'rN7n7otQDd6FczFgLdlqtyMVrn3HMfXoKk',
          Flags: SponsorshipFlags.lsfSponsorshipRequireSignForReserve,
        } as Sponsorship,
      },
    }

    const originalRequest = client.request.bind(client)
    const mockFn: MockRequestFnInterface = async (req) => {
      if (req.command === 'ledger_entry') {
        return mockResponse
      }
      return originalRequest(req as LedgerEntryRequest)
    }
    client.request = mockFn as typeof client.request

    const tx: Payment = {
      TransactionType: 'Payment',
      Account: 'rN7n7otQDd6FczFgLdlqtyMVrn3HMfXoKk',
      Destination: 'rpZc4mVfWUif9CRoHRKKcmhu1nx2xktxBo',
      Amount: '1000000',
      Sponsor: 'rfkE1aSy9G8Upk4JssnwBxhEv5p4mn2KTy',
      SponsorFlags: SponsorFlags.tfSponsorReserve,
    }

    const result = await validatePreFundedSponsorship(client, tx, '100')

    assert.isFalse(result.valid)
    assert.include(result.error ?? '', 'lsfSponsorshipRequireSignForReserve')
  })

  it('looks up the Sponsorship object using Delegate as the sponsee when present', async function () {
    let requestedSponsee: string | undefined
    const mockResponse = {
      status: 'success',
      type: 'response',
      result: {
        node: {
          LedgerEntryType: 'Sponsorship',
          Owner: 'rfkE1aSy9G8Upk4JssnwBxhEv5p4mn2KTy',
          Sponsee: 'rDelegateAccount11111111111111111111111',
          Flags: 0,
        } as Sponsorship,
      },
    }

    const originalRequest = client.request.bind(client)
    const mockFn: MockRequestFnInterface = async (req) => {
      if (req.command === 'ledger_entry') {
        const ledgerEntryReq = req as LedgerEntryRequest

        const sponsorshipParam = (
          ledgerEntryReq as unknown as {
            sponsorship: { sponsor: string; sponsee: string }
          }
        ).sponsorship
        requestedSponsee = sponsorshipParam.sponsee
        return mockResponse
      }
      return originalRequest(req as LedgerEntryRequest)
    }
    client.request = mockFn as typeof client.request

    const tx: Payment = {
      TransactionType: 'Payment',
      Account: 'rN7n7otQDd6FczFgLdlqtyMVrn3HMfXoKk',
      Destination: 'rpZc4mVfWUif9CRoHRKKcmhu1nx2xktxBo',
      Amount: '1000000',
      Sponsor: 'rfkE1aSy9G8Upk4JssnwBxhEv5p4mn2KTy',
      SponsorFlags: SponsorFlags.tfSponsorReserve,
      Delegate: 'rDelegateAccount11111111111111111111111',
    }

    const result = await validatePreFundedSponsorship(client, tx, '100')

    assert.isTrue(result.valid)
    assert.strictEqual(
      requestedSponsee,
      'rDelegateAccount11111111111111111111111',
    )
  })
})
