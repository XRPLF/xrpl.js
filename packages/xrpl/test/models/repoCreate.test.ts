import { stringToHex } from '@xrplf/isomorphic/utils'

import { RepoCreate } from '../../src/models/transactions'
import { validateRepoCreate } from '../../src/models/transactions/repoCreate'
import { assertTxIsValid, assertTxValidationError } from '../testUtils'

const assertValid = (tx: any): void => assertTxIsValid(tx, validateRepoCreate)
const assertInvalid = (tx: any, message: string): void =>
  assertTxValidationError(tx, validateRepoCreate, message)

const ISSUER = 'rPEPPER7kfTD9w2To4CQk6UCfuHM9c6GDY'
const MPT_ID = '00000001F40B468D5AC0DBA36E2941877AC2E9BBD48262A1'
const UINT32_MAX = 4294967295

/**
 * RepoCreate Transaction Verification Testing.
 *
 * Providing runtime verification testing for each specific transaction type.
 */
describe('RepoCreate', function () {
  let tx: RepoCreate

  beforeEach(function () {
    tx = {
      TransactionType: 'RepoCreate',
      Account: 'rfmDuhDyLGgx94qiwf3YF8BUV5j6KSvE8',
      Counterparty: ISSUER,
      CollateralAmount: { mpt_issuance_id: MPT_ID, value: '1000' },
      PurchasePrice: '5000000',
      InterestRate: 500,
      Expiration: 800000000,
      MaturityDate: 810000000,
      GracePeriod: 86400,
    }
  })

  it('verifies valid RepoCreate', function () {
    assertValid(tx)
  })

  it('verifies valid RepoCreate with IOU collateral, MPT cash and Data', function () {
    tx.CollateralAmount = { currency: 'USD', issuer: ISSUER, value: '10.5' }
    tx.PurchasePrice = { mpt_issuance_id: MPT_ID, value: '20' }
    tx.Data = stringToHex('a'.repeat(256))
    tx.InterestRate = 100000
    assertValid(tx)
  })

  it('verifies GracePeriod up to the 32-bit limit', function () {
    tx.GracePeriod = UINT32_MAX - tx.MaturityDate
    assertValid(tx)
  })

  it('throws w/ missing Counterparty', function () {
    // @ts-expect-error for test
    tx.Counterparty = undefined
    assertInvalid(tx, 'RepoCreate: missing field Counterparty')
  })

  it('throws w/ invalid Counterparty', function () {
    tx.Counterparty = 'notanaccount'
    assertInvalid(tx, 'RepoCreate: invalid field Counterparty')
  })

  it('throws w/ Counterparty equal to Account', function () {
    tx.Counterparty = tx.Account
    assertInvalid(tx, 'RepoCreate: Counterparty must not be the Account')
  })

  it('throws w/ missing CollateralAmount', function () {
    // @ts-expect-error for test
    tx.CollateralAmount = undefined
    assertInvalid(tx, 'RepoCreate: missing field CollateralAmount')
  })

  it('throws w/ invalid CollateralAmount', function () {
    // @ts-expect-error for test
    tx.CollateralAmount = 1000
    assertInvalid(tx, 'RepoCreate: invalid field CollateralAmount')
  })

  it('throws w/ missing PurchasePrice', function () {
    // @ts-expect-error for test
    tx.PurchasePrice = undefined
    assertInvalid(tx, 'RepoCreate: missing field PurchasePrice')
  })

  it('throws w/ invalid PurchasePrice', function () {
    // @ts-expect-error for test
    tx.PurchasePrice = { value: '1' }
    assertInvalid(tx, 'RepoCreate: invalid field PurchasePrice')
  })

  describe('amount, term and Data rules', function () {
    it('throws w/ zero CollateralAmount', function () {
      tx.CollateralAmount = { mpt_issuance_id: MPT_ID, value: '0' }
      assertInvalid(tx, 'RepoCreate: CollateralAmount must be positive')
    })

    it('throws w/ negative PurchasePrice', function () {
      tx.PurchasePrice = { currency: 'USD', issuer: ISSUER, value: '-1' }
      assertInvalid(tx, 'RepoCreate: PurchasePrice must be positive')
    })

    it('throws w/ PurchasePrice above the XRP supply', function () {
      tx.PurchasePrice = '100000000000000001'
      assertInvalid(
        tx,
        'RepoCreate: PurchasePrice exceeds the maximum XRP amount',
      )
    })

    it('throws w/ collateral and cash in the same MPT', function () {
      tx.PurchasePrice = { mpt_issuance_id: MPT_ID.toLowerCase(), value: '1' }
      assertInvalid(
        tx,
        'RepoCreate: CollateralAmount and PurchasePrice must be different assets',
      )
    })

    it('throws w/ collateral and cash in the same IOU', function () {
      tx.CollateralAmount = { currency: 'USD', issuer: ISSUER, value: '1' }
      tx.PurchasePrice = {
        currency: '0000000000000000000000005553440000000000',
        issuer: ISSUER,
        value: '2',
      }
      assertInvalid(
        tx,
        'RepoCreate: CollateralAmount and PurchasePrice must be different assets',
      )
    })

    it('throws w/ collateral and cash both XRP', function () {
      tx.CollateralAmount = '1000'
      assertInvalid(
        tx,
        'RepoCreate: CollateralAmount and PurchasePrice must be different assets',
      )
    })

    it('throws w/ non-number InterestRate', function () {
      // @ts-expect-error for test
      tx.InterestRate = '5'
      assertInvalid(tx, 'RepoCreate: invalid field InterestRate')
    })

    it('throws w/ InterestRate above 100000', function () {
      tx.InterestRate = 100001
      assertInvalid(tx, 'RepoCreate: InterestRate must not exceed 100000')
    })

    it('throws w/ missing Expiration', function () {
      // @ts-expect-error for test
      tx.Expiration = undefined
      assertInvalid(tx, 'RepoCreate: missing field Expiration')
    })

    it('throws w/ missing MaturityDate', function () {
      // @ts-expect-error for test
      tx.MaturityDate = undefined
      assertInvalid(tx, 'RepoCreate: missing field MaturityDate')
    })

    it('throws w/ missing GracePeriod', function () {
      // @ts-expect-error for test
      tx.GracePeriod = undefined
      assertInvalid(tx, 'RepoCreate: missing field GracePeriod')
    })

    it('throws w/ MaturityDate equal to Expiration', function () {
      tx.MaturityDate = tx.Expiration
      assertInvalid(tx, 'RepoCreate: MaturityDate must be after Expiration')
    })

    it('throws w/ MaturityDate plus GracePeriod past the 32-bit limit', function () {
      tx.GracePeriod = UINT32_MAX - tx.MaturityDate + 1
      assertInvalid(
        tx,
        'RepoCreate: MaturityDate plus GracePeriod must fit in 32 bits',
      )
    })

    it('throws w/ non-string Data', function () {
      // @ts-expect-error for test
      tx.Data = 12
      assertInvalid(tx, 'RepoCreate: invalid field Data')
    })

    it('throws w/ Data not hex', function () {
      tx.Data = 'zz'
      assertInvalid(
        tx,
        'RepoCreate: Data must be a hex string of at most 256 bytes',
      )
    })

    it('throws w/ Data above 256 bytes', function () {
      tx.Data = stringToHex('a'.repeat(257))
      assertInvalid(
        tx,
        'RepoCreate: Data must be a hex string of at most 256 bytes',
      )
    })

    it('throws w/ an unknown flag', function () {
      tx.Flags = 0x00000001
      assertInvalid(tx, 'RepoCreate: invalid Flags')
    })
  })
})
