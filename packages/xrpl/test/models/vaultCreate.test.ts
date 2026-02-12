import { stringToHex } from '@xrplf/isomorphic/utils'

import { MPTokenMetadata } from '../../src'
import {
  VaultCreateFlags,
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
  let tx: any

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
    tx.Asset = undefined
    assertInvalid(tx, 'VaultCreate: missing field Asset')
  })

  it('throws w/ invalid Asset', function () {
    tx.Asset = 123
    assertInvalid(
      tx,
      'VaultCreate: invalid field Asset, expected a valid Currency',
    )
  })

  it('throws w/ Data field not hex', function () {
    tx.Data = 'zznothex'
    assertInvalid(
      tx,
      'VaultCreate: invalid field Data, expected a valid hex string',
    )
  })

  it('throws w/ Data field too large', function () {
    tx.Data = stringToHex('a'.repeat(257))
    assertInvalid(tx, 'VaultCreate: Data exceeds 256 bytes (actual: 257)')
  })

  it('throws w/ MPTokenMetadata not hex', function () {
    tx.MPTokenMetadata = 'ggnothex'
    assertInvalid(
      tx,
      'VaultCreate: invalid field MPTokenMetadata, expected a valid hex string',
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
    tx.WithdrawalPolicy = 'invalid'
    assertInvalid(
      tx,
      'VaultCreate: invalid field WithdrawalPolicy, expected a valid number',
    )
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
