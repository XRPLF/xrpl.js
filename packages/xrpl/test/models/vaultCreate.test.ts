import { stringToHex } from '@xrplf/isomorphic/utils'

import { MPTokenMetadata } from '../../src'
import {
  VaultCreate,
  VaultCreateFlags,
  VaultKind,
  VaultWithdrawalPolicy,
} from '../../src/models/transactions'
import { validateVaultCreate } from '../../src/models/transactions/vaultCreate'
import { MPT_META_WARNING_HEADER } from '../../src/models/utils/mptokenMetadata'
import { assertTxIsValid, assertTxValidationError } from '../testUtils'

const assertValid = (tx: any): void => assertTxIsValid(tx, validateVaultCreate)
const assertInvalid = (tx: any, message: string): void =>
  assertTxValidationError(tx, validateVaultCreate, message)

/**
 * VaultCreate Transaction Verification Testing.
 *
 * Providing runtime verification testing for each specific transaction type.
 */
describe('VaultCreate', function () {
  let tx: VaultCreate

  beforeEach(function () {
    tx = {
      TransactionType: 'VaultCreate',
      Account: 'rfmDuhDyLGgx94qiwf3YF8BUV5j6KSvE8',
      Asset: { currency: 'XRP' },
      WithdrawalPolicy: VaultWithdrawalPolicy.vaultStrategyFirstComeFirstServe,
    }
  })

  it('verifies valid VaultCreate', function () {
    assertValid(tx)
  })

  it('verifies MPT/IOU Currency as Asset', function () {
    tx.Asset = {
      mpt_issuance_id:
        '983F536DBB46D5BBF43A0B5890576874EE1CF48CE31CA508A529EC17CD1A90EF',
    }
    assertValid(tx)

    tx.Asset = {
      currency: 'USD',
      issuer: 'rfmDuhDyLGgx94qiwf3YF8BUV5j6KSvE8',
    }
    assertValid(tx)
  })

  it('throws w/ missing Asset', function () {
    // @ts-expect-error for test
    tx.Asset = undefined
    assertInvalid(tx, 'VaultCreate: missing field Asset')
  })

  it('throws w/ invalid Asset', function () {
    // @ts-expect-error for test
    tx.Asset = 123
    assertInvalid(tx, 'VaultCreate: invalid field Asset')
  })

  it('throws w/ Data field not hex', function () {
    tx.Data = 'zznothex'
    assertInvalid(tx, 'VaultCreate: Data must be a valid hex string')
  })

  it('throws w/ Data field too large', function () {
    tx.Data = stringToHex('a'.repeat(257))
    assertInvalid(tx, 'VaultCreate: Data exceeds 256 bytes (actual: 257)')
  })

  it('throws w/ MPTokenMetadata not hex', function () {
    tx.MPTokenMetadata = 'ggnothex'
    assertInvalid(
      tx,
      'VaultCreate: MPTokenMetadata must be a valid non-empty hex string',
    )
  })

  it('throws w/ MPTokenMetadata field too large', function () {
    tx.MPTokenMetadata = stringToHex('a'.repeat(1025))
    assertInvalid(
      tx,
      'VaultCreate: MPTokenMetadata exceeds 1024 bytes (actual: 1025)',
    )
  })

  it('throws w/ non-number WithdrawalPolicy', function () {
    // @ts-expect-error for test
    tx.WithdrawalPolicy = 'invalid'
    assertInvalid(tx, 'VaultCreate: invalid field WithdrawalPolicy')
  })

  it('allows DomainID when tfVaultPrivate flag set', function () {
    tx.DomainID = 'ABCDEF1234567890'
    tx.Flags = VaultCreateFlags.tfVaultPrivate
    assertValid(tx)
  })

  it('throws w/ DomainID set but tfVaultPrivate flag missing', function () {
    tx.DomainID = 'ABCDEF1234567890'
    tx.Flags = 0
    assertInvalid(
      tx,
      'VaultCreate: Cannot set DomainID unless tfVaultPrivate flag is set.',
    )
  })

  describe('Scale field validation', function () {
    it('throws w/ Scale provided for XRP asset', function () {
      tx.Asset = { currency: 'XRP' }
      tx.Scale = 5
      assertInvalid(
        tx,
        'VaultCreate: Scale parameter must not be provided for XRP or MPT assets',
      )
    })

    it('throws w/ Scale provided for MPT asset', function () {
      tx.Asset = {
        mpt_issuance_id:
          '983F536DBB46D5BBF43A0B5890576874EE1CF48CE31CA508A529EC17CD1A90EF',
      }
      tx.Scale = 5
      assertInvalid(
        tx,
        'VaultCreate: Scale parameter must not be provided for XRP or MPT assets',
      )
    })

    it('allows Scale for IOU asset with valid value (0)', function () {
      tx.Asset = {
        currency: 'USD',
        issuer: 'rfmDuhDyLGgx94qiwf3YF8BUV5j6KSvE8',
      }
      tx.Scale = 0
      assertValid(tx)
    })

    it('allows Scale for IOU asset with valid value (18)', function () {
      tx.Asset = {
        currency: 'USD',
        issuer: 'rfmDuhDyLGgx94qiwf3YF8BUV5j6KSvE8',
      }
      tx.Scale = 18
      assertValid(tx)
    })

    it('allows Scale for IOU asset with valid value (10)', function () {
      tx.Asset = {
        currency: 'USD',
        issuer: 'rfmDuhDyLGgx94qiwf3YF8BUV5j6KSvE8',
      }
      tx.Scale = 10
      assertValid(tx)
    })

    it('throws w/ Scale less than 0 for IOU asset', function () {
      tx.Asset = {
        currency: 'USD',
        issuer: 'rfmDuhDyLGgx94qiwf3YF8BUV5j6KSvE8',
      }
      tx.Scale = -1
      assertInvalid(
        tx,
        'VaultCreate: Scale must be a number between 0 and 18 inclusive for IOU assets',
      )
    })

    it('throws w/ Scale greater than 18 for IOU asset', function () {
      tx.Asset = {
        currency: 'USD',
        issuer: 'rfmDuhDyLGgx94qiwf3YF8BUV5j6KSvE8',
      }
      tx.Scale = 19
      assertInvalid(
        tx,
        'VaultCreate: Scale must be a number between 0 and 18 inclusive for IOU assets',
      )
    })

    it('throws w/ non-number Scale for IOU asset', function () {
      tx.Asset = {
        currency: 'USD',
        issuer: 'rfmDuhDyLGgx94qiwf3YF8BUV5j6KSvE8',
      }
      // @ts-expect-error for test
      tx.Scale = 'invalid'
      assertInvalid(tx, 'VaultCreate: invalid field Scale')
    })

    it('allows no Scale for IOU asset', function () {
      tx.Asset = {
        currency: 'USD',
        issuer: 'rfmDuhDyLGgx94qiwf3YF8BUV5j6KSvE8',
      }
      assertValid(tx)
    })
  })

  describe('close-ended vault validation (XLS-587)', function () {
    it('allows a close-ended vault with both dates', function () {
      tx.VaultKind = VaultKind.vaultKindClosed
      tx.SubscriptionDate = 800000000
      tx.RedemptionDate = 810000000
      assertValid(tx)
    })

    it('allows an open-ended vault (VaultKind=0) with no dates', function () {
      tx.VaultKind = VaultKind.vaultKindOpen
      assertValid(tx)
    })

    it('allows the minimum investment period boundary (180s)', function () {
      tx.VaultKind = VaultKind.vaultKindClosed
      tx.SubscriptionDate = 800000000
      tx.RedemptionDate = 800000180
      assertValid(tx)
    })

    it('throws w/ close-ended vault missing RedemptionDate', function () {
      tx.VaultKind = VaultKind.vaultKindClosed
      tx.SubscriptionDate = 800000000
      assertInvalid(
        tx,
        'VaultCreate: A close-ended vault requires both SubscriptionDate and RedemptionDate',
      )
    })

    it('throws w/ close-ended vault missing SubscriptionDate', function () {
      tx.VaultKind = VaultKind.vaultKindClosed
      tx.RedemptionDate = 810000000
      assertInvalid(
        tx,
        'VaultCreate: A close-ended vault requires both SubscriptionDate and RedemptionDate',
      )
    })

    it('throws w/ dates set on an open-ended vault', function () {
      tx.SubscriptionDate = 800000000
      tx.RedemptionDate = 810000000
      assertInvalid(
        tx,
        'VaultCreate: SubscriptionDate and RedemptionDate can only be set on a close-ended vault (VaultKind=1)',
      )
    })

    it('throws w/ investment period below the minimum (180s)', function () {
      tx.VaultKind = VaultKind.vaultKindClosed
      tx.SubscriptionDate = 800000000
      tx.RedemptionDate = 800000179
      assertInvalid(
        tx,
        'VaultCreate: RedemptionDate - SubscriptionDate must be within [180, 946708560) seconds',
      )
    })

    it('throws w/ RedemptionDate before SubscriptionDate', function () {
      tx.VaultKind = VaultKind.vaultKindClosed
      tx.SubscriptionDate = 810000000
      tx.RedemptionDate = 800000000
      assertInvalid(
        tx,
        'VaultCreate: RedemptionDate - SubscriptionDate must be within [180, 946708560) seconds',
      )
    })

    it('throws w/ investment period at the exclusive maximum', function () {
      tx.VaultKind = VaultKind.vaultKindClosed
      tx.SubscriptionDate = 0
      tx.RedemptionDate = 946708560
      assertInvalid(
        tx,
        'VaultCreate: RedemptionDate - SubscriptionDate must be within [180, 946708560) seconds',
      )
    })

    it('throws w/ non-number VaultKind', function () {
      // @ts-expect-error for test
      tx.VaultKind = 'invalid'
      assertInvalid(tx, 'VaultCreate: invalid field VaultKind')
    })

    it('throws w/ an unsupported numeric VaultKind', function () {
      tx.VaultKind = 2
      assertInvalid(
        tx,
        'VaultCreate: VaultKind must be 0 (open-ended) or 1 (close-ended)',
      )
    })

    it('throws w/ a NaN SubscriptionDate', function () {
      tx.VaultKind = VaultKind.vaultKindClosed
      tx.SubscriptionDate = NaN
      tx.RedemptionDate = 810000000
      assertInvalid(
        tx,
        'VaultCreate: SubscriptionDate must be an integer number of seconds since the Ripple Epoch',
      )
    })

    it('throws w/ a NaN RedemptionDate', function () {
      tx.VaultKind = VaultKind.vaultKindClosed
      tx.SubscriptionDate = 800000000
      tx.RedemptionDate = NaN
      assertInvalid(
        tx,
        'VaultCreate: RedemptionDate must be an integer number of seconds since the Ripple Epoch',
      )
    })

    it('throws w/ a non-integer RedemptionDate', function () {
      tx.VaultKind = VaultKind.vaultKindClosed
      tx.SubscriptionDate = 800000000
      tx.RedemptionDate = 810000000.5
      assertInvalid(
        tx,
        'VaultCreate: RedemptionDate must be an integer number of seconds since the Ripple Epoch',
      )
    })
  })
})

/**
 * Test console warning is logged while validating VaultCreate for MPTokenMetadata field.
 */
/* eslint-disable no-console -- Require to test console warnings  */
describe('MPTokenMetadata warnings', function () {
  beforeEach(() => {
    jest.spyOn(console, 'warn')
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it(`logs console warning`, function () {
    const mptMetaData: MPTokenMetadata = {
      ticker: 'TBILL',
      name: 'T-Bill Token',
      asset_class: 'rwa',
      asset_subclass: 'treasury',
      issuer_name: 'Issuer',
    } as MPTokenMetadata
    const tx = {
      TransactionType: 'VaultCreate',
      Account: 'rfmDuhDyLGgx94qiwf3YF8BUV5j6KSvE8',
      Asset: { currency: 'XRP' },
      WithdrawalPolicy: VaultWithdrawalPolicy.vaultStrategyFirstComeFirstServe,
      MPTokenMetadata: stringToHex(JSON.stringify(mptMetaData)),
    }

    assertValid(tx)

    const expectedMessage = [
      MPT_META_WARNING_HEADER,
      '- icon/i: should be a non-empty string.',
    ].join('\n')

    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining(expectedMessage),
    )
  })
})
/* eslint-enable no-console  */
