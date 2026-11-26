import { assert } from 'chai'

import { Client } from '../../src/client'
import { XrplError } from '../../src/errors'
import type Sponsorship from '../../src/models/ledger/Sponsorship'
import { SponsorshipFlags } from '../../src/models/ledger/Sponsorship'
import type { LedgerEntryRequest } from '../../src/models/methods'
import { SponsorFlags } from '../../src/models/transactions/common'
import type { Payment } from '../../src/models/transactions/payment'
import { validateSponsorship } from '../../src/sugar/validateSponsorship'
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

describe('validateSponsorship', function () {
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

    const result = await validateSponsorship(client, tx, '100')

    assert.isFalse(result.valid)
    assert.include(result.error ?? '', 'Sponsor and SponsorFlags')
  })

  it('rejects when no fee is available to validate against', async function () {
    const tx: Payment = {
      TransactionType: 'Payment',
      Account: 'rN7n7otQDd6FczFgLdlqtyMVrn3HMfXoKk',
      Destination: 'rpZc4mVfWUif9CRoHRKKcmhu1nx2xktxBo',
      Amount: '1000000',
      Sponsor: 'rfkE1aSy9G8Upk4JssnwBxhEv5p4mn2KTy',
      SponsorFlags: SponsorFlags.spfSponsorFee,
    }

    // Neither estimatedFee nor tx.Fee is provided.
    const result = await validateSponsorship(client, tx)

    assert.isFalse(result.valid)
    assert.include(result.error ?? '', 'No fee available')
  })

  it('treats a null ledger_entry node as no Sponsorship rather than crashing', async function () {
    // Regression test: `typeof null === 'object'`, so a null node would reach
    // the `in` operator and throw a TypeError without an explicit null guard.
    const originalRequest = client.request.bind(client)
    const mockFn: MockRequestFnInterface = async (req) => {
      if (req.command === 'ledger_entry') {
        return {
          status: 'success',
          type: 'response',
          result: { node: null },
        } as unknown as MockResponse
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
      SponsorFlags: SponsorFlags.spfSponsorFee,
    }

    const result = await validateSponsorship(client, tx, '100')

    assert.isFalse(result.valid)
    assert.include(result.error ?? '', 'No Sponsorship ledger entry found')
  })

  it('propagates a rippled error whose message happens to mention entryNotFound but whose structured code does not match', async function () {
    // Regression test: entryNotFound detection must key off the structured
    // rippled error code (error.data.error), not a substring match on the
    // message, which could false-positive on unrelated errors.
    const originalRequest = client.request.bind(client)
    const mockFn: MockRequestFnInterface = async (req) => {
      if (req.command === 'ledger_entry') {
        throw new XrplError(
          'some other failure mentioning entryNotFound in passing',
          {
            error: 'someOtherError',
          },
        )
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
      SponsorFlags: SponsorFlags.spfSponsorFee,
    }

    const result = await validateSponsorship(client, tx, '100')

    assert.isFalse(result.valid)
    assert.include(result.error ?? '', 'some other failure')
  })

  it('validates co-signed sponsorship when no Sponsorship object exists', async function () {
    // A co-signed transaction is fully authorized by the sponsor signature
    // alone when there is no persistent Sponsorship object -- rippled's
    // Transactor::checkSponsor only requires the object to exist for
    // pre-funded (non-co-signed) sponsorship.
    const originalRequest = client.request.bind(client)
    const mockFn: MockRequestFnInterface = async (req) => {
      if (req.command === 'ledger_entry') {
        throw new XrplError('entryNotFound', { error: 'entryNotFound' })
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
      SponsorFlags: SponsorFlags.spfSponsorFee,
      SponsorSignature: {
        SigningPubKey:
          '02FE9932A9C4AA2AC9F0ED0F2B89302DE7C2C95F91D782DA3CF06E64E1C1216449',
        TxnSignature: '3045...',
      },
    }

    const result = await validateSponsorship(client, tx, '100')

    assert.isTrue(result.valid)
    assert.isUndefined(result.sponsorship)
  })

  it('still validates against the Sponsorship object budget when co-signed', async function () {
    // Per XLS-68 8.3.2/8.3.3 and rippled's checkReserve/getFeePayer, an
    // existing Sponsorship object's budget always governs, even when the
    // transaction also carries a SponsorSignature.
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
      SponsorFlags: SponsorFlags.spfSponsorFee,
      SponsorSignature: {
        SigningPubKey:
          '02FE9932A9C4AA2AC9F0ED0F2B89302DE7C2C95F91D782DA3CF06E64E1C1216449',
        TxnSignature: '3045...',
      },
    }

    const result = await validateSponsorship(client, tx, '100')

    assert.isFalse(result.valid)
    assert.include(result.error ?? '', 'insufficient')
  })

  it('ignores lsfSponsorshipRequireSignFor* flags when co-signed', async function () {
    // These flags gate pre-funded (non-co-signed) use only; a sponsor
    // signature already satisfies the "must sign" requirement they express.
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
      SponsorFlags: SponsorFlags.spfSponsorFee,
      SponsorSignature: {
        SigningPubKey:
          '02FE9932A9C4AA2AC9F0ED0F2B89302DE7C2C95F91D782DA3CF06E64E1C1216449',
        TxnSignature: '3045...',
      },
    }

    const result = await validateSponsorship(client, tx, '100')

    assert.isTrue(result.valid)
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
          RemainingOwnerCount: 1,
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
      SponsorFlags: SponsorFlags.spfSponsorReserve,
    }

    const result = await validateSponsorship(client, tx, '100')

    assert.isTrue(result.valid)
    assert.isDefined(result.sponsorship)
  })

  it('rejects reserve-only sponsorship when RemainingOwnerCount is missing', async function () {
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
      SponsorFlags: SponsorFlags.spfSponsorReserve,
    }

    const result = await validateSponsorship(client, tx, '100')

    assert.isFalse(result.valid)
    assert.include(result.error ?? '', 'RemainingOwnerCount')
  })

  it('rejects reserve-only sponsorship when RemainingOwnerCount is 0', async function () {
    const mockResponse = {
      status: 'success',
      type: 'response',
      result: {
        node: {
          LedgerEntryType: 'Sponsorship',
          Owner: 'rfkE1aSy9G8Upk4JssnwBxhEv5p4mn2KTy',
          Sponsee: 'rN7n7otQDd6FczFgLdlqtyMVrn3HMfXoKk',
          Flags: 0,
          RemainingOwnerCount: 0,
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
      SponsorFlags: SponsorFlags.spfSponsorReserve,
    }

    const result = await validateSponsorship(client, tx, '100')

    assert.isFalse(result.valid)
    assert.include(result.error ?? '', 'RemainingOwnerCount')
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
      SponsorFlags: SponsorFlags.spfSponsorFee,
    }

    const result = await validateSponsorship(client, tx, '100')

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
      SponsorFlags: SponsorFlags.spfSponsorFee,
    }

    const result = await validateSponsorship(client, tx, '100')

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
      SponsorFlags: SponsorFlags.spfSponsorFee,
    }

    const result = await validateSponsorship(client, tx, '100')

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
      SponsorFlags: SponsorFlags.spfSponsorReserve,
    }

    const result = await validateSponsorship(client, tx, '100')

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
          RemainingOwnerCount: 1,
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
      SponsorFlags: SponsorFlags.spfSponsorReserve,
      Delegate: 'rDelegateAccount11111111111111111111111',
    }

    const result = await validateSponsorship(client, tx, '100')

    assert.isTrue(result.valid)
    assert.strictEqual(
      requestedSponsee,
      'rDelegateAccount11111111111111111111111',
    )
  })
})
