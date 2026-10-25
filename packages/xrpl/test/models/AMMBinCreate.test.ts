import { AMMBinCreate } from '../../src/models/transactions'
import { validateAMMBinCreate } from '../../src/models/transactions/AMMBinCreate'
import { assertTxIsValid, assertTxValidationError } from '../testUtils'

const assertValid = (tx: any): void => assertTxIsValid(tx, validateAMMBinCreate)
const assertInvalid = (tx: any, message: string): void =>
  assertTxValidationError(tx, validateAMMBinCreate, message)

/**
 * AMMBinCreate Transaction Verification Testing.
 *
 * Providing runtime verification testing for each specific transaction type.
 */
describe('AMMBinCreate', function () {
  let tx: AMMBinCreate

  beforeEach(function () {
    tx = {
      TransactionType: 'AMMBinCreate',
      Account: 'rWYkbWkCeg8dP6rXALnjgZSjjLyih5NXm',
      Asset: { currency: 'XRP' },
      Asset2: {
        currency: 'ETH',
        issuer: 'rP9jPyP5kyvFRb6ZiRghAGw5u8SGAmU4bd',
      },
      BinID: 7,
      Sequence: 1337,
    }
  })

  it('verifies valid AMMBinCreate', function () {
    assertValid(tx)
  })

  it('verifies BinID at the bounds', function () {
    tx.BinID = -221818
    assertValid(tx)
    tx.BinID = 221818
    assertValid(tx)
  })

  it('verifies an MPT asset', function () {
    tx.Asset2 = {
      mpt_issuance_id: '000004C463C52827307480341125DA0577DEFC38405B0E3E',
    }
    assertValid(tx)
  })

  it('throws w/ missing Asset', function () {
    // @ts-expect-error for test
    tx.Asset = undefined
    assertInvalid(tx, 'AMMBinCreate: missing field Asset')
  })

  it('throws w/ invalid Asset', function () {
    // @ts-expect-error for test
    tx.Asset = 1234
    assertInvalid(tx, 'AMMBinCreate: invalid field Asset')
  })

  it('throws w/ missing Asset2', function () {
    // @ts-expect-error for test
    tx.Asset2 = undefined
    assertInvalid(tx, 'AMMBinCreate: missing field Asset2')
  })

  it('throws w/ invalid Asset2', function () {
    // @ts-expect-error for test
    tx.Asset2 = 1234
    assertInvalid(tx, 'AMMBinCreate: invalid field Asset2')
  })

  it('throws w/ missing BinID', function () {
    // @ts-expect-error for test
    tx.BinID = undefined
    assertInvalid(tx, 'AMMBinCreate: missing field BinID')
  })

  it('throws w/ invalid BinID', function () {
    // @ts-expect-error for test
    tx.BinID = '7'
    assertInvalid(tx, 'AMMBinCreate: invalid field BinID')
  })

  it('throws w/ BinID below the minimum', function () {
    tx.BinID = -221819
    assertInvalid(tx, 'AMMBinCreate: BinID must be between -221818 and 221818')
  })

  it('throws w/ BinID above the maximum', function () {
    tx.BinID = 221819
    assertInvalid(tx, 'AMMBinCreate: BinID must be between -221818 and 221818')
  })
})
