import { assert } from 'chai'

import {
  AccountObjectsRequest,
  AccountSponsoringRequest,
  AccountSponsoringResponse,
} from '../../src/models/methods'
import Check from '../../src/models/ledger/Check'
import Escrow from '../../src/models/ledger/Escrow'
import Offer from '../../src/models/ledger/Offer'
import AccountRoot from '../../src/models/ledger/AccountRoot'
import { BaseLedgerEntry } from '../../src/models/ledger/BaseLedgerEntry'

/**
 * Tests for XLS-0068 Sponsorship Feature Changes.
 *
 * These tests verify that the TypeScript interfaces are correctly defined
 * for the sponsorship-related RPC methods and ledger entries.
 */
describe('Sponsorship', function () {
  /**
   * Note: xrpl.js uses TypeScript for compile-time type checking and relies on
   * server-side validation for runtime checks. The following tests document
   * the expected behavior and constraints per XLS-0068 specification.
   *
   * Server-side validations include:
   * - sponsored parameter must be a boolean (Section 15)
   * - account must be a valid AccountID (Section 16)
   * - Sponsor != Owner (Section 4.3.2)
   * - FeeAmount >= 0 (Section 5.7)
   * - ReserveCount >= 0 (Section 5.7)
   */

  describe('AccountObjectsRequest with sponsored filter', function () {
    it('should accept request with sponsored: true', function () {
      const request: AccountObjectsRequest = {
        command: 'account_objects',
        account: 'rN7n3473SaZBCG4dFL83w7a1RXtXtbk2D9',
        sponsored: true,
      }

      assert.strictEqual(request.command, 'account_objects')
      assert.strictEqual(request.sponsored, true)
    })

    it('should accept request with sponsored: false', function () {
      const request: AccountObjectsRequest = {
        command: 'account_objects',
        account: 'rN7n3473SaZBCG4dFL83w7a1RXtXtbk2D9',
        sponsored: false,
      }

      assert.strictEqual(request.command, 'account_objects')
      assert.strictEqual(request.sponsored, false)
    })

    it('should accept request without sponsored (optional field)', function () {
      const request: AccountObjectsRequest = {
        command: 'account_objects',
        account: 'rN7n3473SaZBCG4dFL83w7a1RXtXtbk2D9',
      }

      assert.strictEqual(request.command, 'account_objects')
      assert.isUndefined(request.sponsored)
    })

    it('should accept request with all optional fields', function () {
      const request: AccountObjectsRequest = {
        command: 'account_objects',
        account: 'rN7n3473SaZBCG4dFL83w7a1RXtXtbk2D9',
        type: 'check',
        deletion_blockers_only: true,
        sponsored: true,
        limit: 100,
        ledger_index: 'validated',
      }

      assert.strictEqual(request.command, 'account_objects')
      assert.strictEqual(request.type, 'check')
      assert.strictEqual(request.deletion_blockers_only, true)
      assert.strictEqual(request.sponsored, true)
      assert.strictEqual(request.limit, 100)
      assert.strictEqual(request.ledger_index, 'validated')
    })
  })

  describe('AccountSponsoringRequest (Clio RPC method)', function () {
    it('should accept basic account_sponsoring request', function () {
      const request: AccountSponsoringRequest = {
        command: 'account_sponsoring',
        account: 'rN7n3473SaZBCG4dFL83w7a1RXtXtbk2D9',
      }

      assert.strictEqual(request.command, 'account_sponsoring')
      assert.strictEqual(request.account, 'rN7n3473SaZBCG4dFL83w7a1RXtXtbk2D9')
    })

    it('should accept request with all optional fields', function () {
      const request: AccountSponsoringRequest = {
        command: 'account_sponsoring',
        account: 'rN7n3473SaZBCG4dFL83w7a1RXtXtbk2D9',
        type: 'escrow',
        deletion_blockers_only: true,
        limit: 50,
        ledger_index: 'validated',
      }

      assert.strictEqual(request.command, 'account_sponsoring')
      assert.strictEqual(request.type, 'escrow')
      assert.strictEqual(request.deletion_blockers_only, true)
      assert.strictEqual(request.limit, 50)
    })

    it('should have correct response structure', function () {
      // Create a mock response that matches AccountSponsoringResponse
      const response: AccountSponsoringResponse = {
        id: 1,
        type: 'response',
        result: {
          account: 'rN7n3473SaZBCG4dFL83w7a1RXtXtbk2D9',
          sponsored_objects: [],
          ledger_hash:
            'C8BFA74A740AA22AD9BD724781589319052398B0C6C817B88D55628E07B7B4A1',
          ledger_index: 150,
          validated: true,
        },
      }

      assert.strictEqual(response.type, 'response')
      assert.strictEqual(
        response.result.account,
        'rN7n3473SaZBCG4dFL83w7a1RXtXtbk2D9',
      )
      assert.isArray(response.result.sponsored_objects)
      assert.strictEqual(response.result.validated, true)
    })
  })

  describe('BaseLedgerEntry Sponsor field', function () {
    it('should allow Sponsor field on Check ledger entry', function () {
      const check: Check = {
        LedgerEntryType: 'Check',
        index:
          '5463C6E08862A1FAE5EDAC12D70ADB16546A1F674930521295BC082494B62924',
        Account: 'rN7n3473SaZBCG4dFL83w7a1RXtXtbk2D9',
        Destination: 'rfkE1aSy9G8Upk4JssnwBxhEv5p4mn2KTy',
        Flags: 0,
        OwnerNode: '0',
        PreviousTxnID:
          '5463C6E08862A1FAE5EDAC12D70ADB16546A1F674930521295BC082494B62924',
        PreviousTxnLgrSeq: 12345,
        SendMax: '1000000',
        Sequence: 1,
        Sponsor: 'rPT1Sjq2YGrBMTttX4GZHjKu9dyfzbpAYe',
      }

      assert.strictEqual(check.Sponsor, 'rPT1Sjq2YGrBMTttX4GZHjKu9dyfzbpAYe')
    })

    it('should allow Sponsor field on Escrow ledger entry', function () {
      const escrow: Escrow = {
        LedgerEntryType: 'Escrow',
        index:
          '5463C6E08862A1FAE5EDAC12D70ADB16546A1F674930521295BC082494B62924',
        Account: 'rN7n3473SaZBCG4dFL83w7a1RXtXtbk2D9',
        Destination: 'rfkE1aSy9G8Upk4JssnwBxhEv5p4mn2KTy',
        Amount: '1000000',
        Flags: 0,
        OwnerNode: '0',
        PreviousTxnID:
          '5463C6E08862A1FAE5EDAC12D70ADB16546A1F674930521295BC082494B62924',
        PreviousTxnLgrSeq: 12345,
        Sponsor: 'rPT1Sjq2YGrBMTttX4GZHjKu9dyfzbpAYe',
      }

      assert.strictEqual(escrow.Sponsor, 'rPT1Sjq2YGrBMTttX4GZHjKu9dyfzbpAYe')
    })

    it('should allow Sponsor field on Offer ledger entry', function () {
      const offer: Offer = {
        LedgerEntryType: 'Offer',
        index:
          '5463C6E08862A1FAE5EDAC12D70ADB16546A1F674930521295BC082494B62924',
        Account: 'rN7n3473SaZBCG4dFL83w7a1RXtXtbk2D9',
        BookDirectory:
          'DFA3B6DDAB58C7E8E5D944E736DA4B7046C30E4F460FD9DE4C1AA535D3D0C000',
        BookNode: '0',
        Flags: 0,
        OwnerNode: '0',
        Sequence: 1,
        TakerGets: '1000000',
        TakerPays: {
          currency: 'USD',
          issuer: 'rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh',
          value: '10',
        },
        PreviousTxnID:
          '5463C6E08862A1FAE5EDAC12D70ADB16546A1F674930521295BC082494B62924',
        PreviousTxnLgrSeq: 12345,
        Sponsor: 'rPT1Sjq2YGrBMTttX4GZHjKu9dyfzbpAYe',
      }

      assert.strictEqual(offer.Sponsor, 'rPT1Sjq2YGrBMTttX4GZHjKu9dyfzbpAYe')
    })

    it('should allow Sponsor field to be optional on ledger entries', function () {
      const escrowWithoutSponsor: Escrow = {
        LedgerEntryType: 'Escrow',
        index:
          '5463C6E08862A1FAE5EDAC12D70ADB16546A1F674930521295BC082494B62924',
        Account: 'rN7n3473SaZBCG4dFL83w7a1RXtXtbk2D9',
        Destination: 'rfkE1aSy9G8Upk4JssnwBxhEv5p4mn2KTy',
        Amount: '1000000',
        Flags: 0,
        OwnerNode: '0',
        PreviousTxnID:
          '5463C6E08862A1FAE5EDAC12D70ADB16546A1F674930521295BC082494B62924',
        PreviousTxnLgrSeq: 12345,
      }

      assert.isUndefined(escrowWithoutSponsor.Sponsor)
    })

    it('should preserve AccountRoot Sponsor field with specific documentation', function () {
      const accountRoot: AccountRoot = {
        LedgerEntryType: 'AccountRoot',
        index:
          '5463C6E08862A1FAE5EDAC12D70ADB16546A1F674930521295BC082494B62924',
        Account: 'rN7n3473SaZBCG4dFL83w7a1RXtXtbk2D9',
        Balance: '1000000000',
        Flags: 0,
        OwnerCount: 0,
        Sequence: 1,
        PreviousTxnID:
          '5463C6E08862A1FAE5EDAC12D70ADB16546A1F674930521295BC082494B62924',
        PreviousTxnLgrSeq: 12345,
        Sponsor: 'rPT1Sjq2YGrBMTttX4GZHjKu9dyfzbpAYe',
        SponsoredOwnerCount: 5,
        SponsoringOwnerCount: 10,
        SponsoringAccountCount: 2,
      }

      assert.strictEqual(
        accountRoot.Sponsor,
        'rPT1Sjq2YGrBMTttX4GZHjKu9dyfzbpAYe',
      )
      assert.strictEqual(accountRoot.SponsoredOwnerCount, 5)
      assert.strictEqual(accountRoot.SponsoringOwnerCount, 10)
      assert.strictEqual(accountRoot.SponsoringAccountCount, 2)
    })

    it('should have Sponsor defined on BaseLedgerEntry interface', function () {
      // Verify that BaseLedgerEntry includes optional Sponsor field
      const baseLedgerEntry: BaseLedgerEntry = {
        index:
          '5463C6E08862A1FAE5EDAC12D70ADB16546A1F674930521295BC082494B62924',
        Sponsor: 'rPT1Sjq2YGrBMTttX4GZHjKu9dyfzbpAYe',
      }

      assert.strictEqual(
        baseLedgerEntry.Sponsor,
        'rPT1Sjq2YGrBMTttX4GZHjKu9dyfzbpAYe',
      )
    })
  })

  /**
   * Edge cases and boundary conditions.
   * Note: These tests document constraints that are enforced server-side.
   * TypeScript provides compile-time type checking for structure.
   */
  describe('Edge cases and constraints (server-side validated)', function () {
    it('should allow empty sponsored_objects array in AccountSponsoringResponse', function () {
      const response: AccountSponsoringResponse = {
        id: 1,
        type: 'response',
        result: {
          account: 'rN7n3473SaZBCG4dFL83w7a1RXtXtbk2D9',
          sponsored_objects: [],
          ledger_hash:
            'C8BFA74A740AA22AD9BD724781589319052398B0C6C817B88D55628E07B7B4A1',
          ledger_index: 150,
          validated: true,
        },
      }

      assert.isArray(response.result.sponsored_objects)
      assert.lengthOf(response.result.sponsored_objects, 0)
    })

    it('should handle AccountObjectsRequest without optional fields', function () {
      // Minimum valid request - only required fields
      const request: AccountObjectsRequest = {
        command: 'account_objects',
        account: 'rN7n3473SaZBCG4dFL83w7a1RXtXtbk2D9',
      }

      assert.strictEqual(request.command, 'account_objects')
      assert.isUndefined(request.sponsored)
      assert.isUndefined(request.type)
      assert.isUndefined(request.limit)
      assert.isUndefined(request.deletion_blockers_only)
    })

    it('should handle AccountSponsoringRequest without optional fields', function () {
      // Minimum valid request - only required fields
      const request: AccountSponsoringRequest = {
        command: 'account_sponsoring',
        account: 'rN7n3473SaZBCG4dFL83w7a1RXtXtbk2D9',
      }

      assert.strictEqual(request.command, 'account_sponsoring')
      assert.isUndefined(request.type)
      assert.isUndefined(request.limit)
      assert.isUndefined(request.deletion_blockers_only)
    })

    it('should allow ledger entries without Sponsor field (unsponsored objects)', function () {
      const escrow: Escrow = {
        LedgerEntryType: 'Escrow',
        index:
          '5463C6E08862A1FAE5EDAC12D70ADB16546A1F674930521295BC082494B62924',
        Account: 'rN7n3473SaZBCG4dFL83w7a1RXtXtbk2D9',
        Destination: 'rfkE1aSy9G8Upk4JssnwBxhEv5p4mn2KTy',
        Amount: '1000000',
        Flags: 0,
        OwnerNode: '0',
        PreviousTxnID:
          '5463C6E08862A1FAE5EDAC12D70ADB16546A1F674930521295BC082494B62924',
        PreviousTxnLgrSeq: 12345,
      }

      // Per XLS-0068 Section 4.3.2: "The field must be omitted when there is no sponsor"
      assert.isUndefined(escrow.Sponsor)
    })

    it('should allow AccountRoot with sponsorship count fields', function () {
      // Per XLS-0068 Section 6.1: AccountRoot has SponsoredOwnerCount, SponsoringOwnerCount, SponsoringAccountCount
      const accountRoot: AccountRoot = {
        LedgerEntryType: 'AccountRoot',
        index:
          '5463C6E08862A1FAE5EDAC12D70ADB16546A1F674930521295BC082494B62924',
        Account: 'rN7n3473SaZBCG4dFL83w7a1RXtXtbk2D9',
        Balance: '1000000000',
        Flags: 0,
        OwnerCount: 10,
        Sequence: 1,
        PreviousTxnID:
          '5463C6E08862A1FAE5EDAC12D70ADB16546A1F674930521295BC082494B62924',
        PreviousTxnLgrSeq: 12345,
        SponsoredOwnerCount: 3,
        SponsoringOwnerCount: 5,
        SponsoringAccountCount: 1,
      }

      // Per XLS-0068 Section 6.3: SponsoredOwnerCount <= OwnerCount
      assert.isAtMost(
        accountRoot.SponsoredOwnerCount!,
        accountRoot.OwnerCount,
        'SponsoredOwnerCount should be <= OwnerCount per XLS-0068 Section 6.3',
      )
    })

    it('should allow AccountRoot without any sponsorship fields (non-sponsored account)', function () {
      const accountRoot: AccountRoot = {
        LedgerEntryType: 'AccountRoot',
        index:
          '5463C6E08862A1FAE5EDAC12D70ADB16546A1F674930521295BC082494B62924',
        Account: 'rN7n3473SaZBCG4dFL83w7a1RXtXtbk2D9',
        Balance: '1000000000',
        Flags: 0,
        OwnerCount: 0,
        Sequence: 1,
        PreviousTxnID:
          '5463C6E08862A1FAE5EDAC12D70ADB16546A1F674930521295BC082494B62924',
        PreviousTxnLgrSeq: 12345,
      }

      assert.isUndefined(accountRoot.Sponsor)
      assert.isUndefined(accountRoot.SponsoredOwnerCount)
      assert.isUndefined(accountRoot.SponsoringOwnerCount)
      assert.isUndefined(accountRoot.SponsoringAccountCount)
    })
  })
})
