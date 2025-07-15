import {
  AMMClawbackFlags,
  validateAMMClawback,
} from '../../src/models/transactions/AMMClawback'
import { assertTxIsValid, assertTxValidationError } from '../testUtils'

const assertValid = (tx: any): void => assertTxIsValid(tx, validateAMMClawback)
const assertInvalid = (tx: any, message: string): void =>
  assertTxValidationError(tx, validateAMMClawback, message)

/**
 * AMMClawback Transaction Verification Testing.
 *
 * Providing runtime verification testing for each specific transaction type.
 */
describe('AMMClawback', function () {
  let ammClawback: any

  beforeEach(function () {
    ammClawback = {
      TransactionType: 'AMMClawback',
      Account: 'rWYkbWkCeg8dP6rXALnjgZSjjLyih5NXm',
      Holder: 'rPyfep3gcLzkosKC9XiE77Y8DZWG6iWDT9',
      Asset: {
        currency: 'USD',
        issuer: 'rWYkbWkCeg8dP6rXALnjgZSjjLyih5NXm',
      },
      Asset2: {
        currency: 'XRP',
      },
      Amount: {
        currency: 'USD',
        issuer: 'rWYkbWkCeg8dP6rXALnjgZSjjLyih5NXm',
        value: '1000',
      },
      Sequence: 1337,
    }
  })

  it(`verifies valid AMMClawback`, function () {
    assertValid(ammClawback)
  })

  it(`verifies valid AMMClawback without Amount`, function () {
    delete ammClawback.Amount
    assertValid(ammClawback)
  })

  it(`verifies valid AMMClawback with tfClawTwoAssets`, function () {
    ammClawback.flags = AMMClawbackFlags.tfClawTwoAssets
    assertValid(ammClawback)
  })

  it(`throws w/ missing Holder`, function () {
    delete ammClawback.Holder
    const errorMessage = 'AMMClawback: missing field Holder'
    assertInvalid(ammClawback, errorMessage)
  })

  it(`throws w/ invalid field Holder`, function () {
    ammClawback.Holder = 1234
    const errorMessage = 'AMMClawback: invalid field Holder'
    assertInvalid(ammClawback, errorMessage)
  })

  it(`throws w/ Holder and Asset.issuer must be distinct`, function () {
    ammClawback.Holder = ammClawback.Asset.issuer
    const errorMessage = 'AMMClawback: Holder and Asset.issuer must be distinct'
    assertInvalid(ammClawback, errorMessage)
  })

  it(`throws w/ missing Asset`, function () {
    delete ammClawback.Asset
    const errorMessage = 'AMMClawback: missing field Asset'
    assertInvalid(ammClawback, errorMessage)
  })

  it(`throws w/ invalid field Asset`, function () {
    ammClawback.Asset = '1000'
    const errorMessage = 'AMMClawback: invalid field Asset'
    assertInvalid(ammClawback, errorMessage)
  })

  it(`throws w/ Account must be the same as Asset.issuer`, function () {
    ammClawback.Account = 'rf1BiGeXwwQoi8Z2ueFYTEXSwuJYfV2Jpn'
    const errorMessage = 'AMMClawback: Account must be the same as Asset.issuer'
    assertInvalid(ammClawback, errorMessage)
  })

  it(`throws w/ missing Asset2`, function () {
    delete ammClawback.Asset2
    const errorMessage = 'AMMClawback: missing field Asset2'
    assertInvalid(ammClawback, errorMessage)
  })

  it(`throws w/ invalid field Asset2`, function () {
    ammClawback.Asset2 = '1000'
    const errorMessage = 'AMMClawback: invalid field Asset2'
    assertInvalid(ammClawback, errorMessage)
  })

  it(`throws w/ invalid field Amount`, function () {
    ammClawback.Amount = 1000
    const errorMessage = 'AMMClawback: invalid field Amount'
    assertInvalid(ammClawback, errorMessage)
  })

  it(`throws w/ Amount.currency must match Asset.currency`, function () {
    ammClawback.Amount.currency = 'ETH'
    const errorMessage =
      'AMMClawback: Amount.currency must match Asset.currency'
    assertInvalid(ammClawback, errorMessage)
  })

  it(`throws w/ Amount.issuer must match Amount.issuer`, function () {
    ammClawback.Amount.issuer = 'rnYgaEtpqpNRt3wxE39demVpDAA817rQEY'
    const errorMessage = 'AMMClawback: Amount.issuer must match Amount.issuer'
    assertInvalid(ammClawback, errorMessage)
  })
})
