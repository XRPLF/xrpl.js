import { TokenConvert } from '../../src/models/transactions'
import { validateTokenConvert } from '../../src/models/transactions/tokenConvert'
import { assertTxIsValid, assertTxValidationError } from '../testUtils'

const assertValid = (tx: any): void => assertTxIsValid(tx, validateTokenConvert)
const assertInvalid = (tx: any, message: string): void =>
  assertTxValidationError(tx, validateTokenConvert, message)

const ISSUER = 'rPEPPER7kfTD9w2To4CQk6UCfuHM9c6GDY'
const ISSUER_MPT_ID = '00000001F40B468D5AC0DBA36E2941877AC2E9BBD48262A1'
const ACCOUNT_MPT_ID = '0000000101476926B590BA3245F63C829116A0A3AF7F382D'

/**
 * TokenConvert Transaction Verification Testing.
 *
 * Providing runtime verification testing for each specific transaction type.
 */
describe('TokenConvert', function () {
  let tx: TokenConvert

  beforeEach(function () {
    tx = {
      TransactionType: 'TokenConvert',
      Account: 'rfmDuhDyLGgx94qiwf3YF8BUV5j6KSvE8',
      Amount: { currency: 'USD', issuer: ISSUER, value: '1.25' },
    }
  })

  it('verifies valid TokenConvert from an IOU', function () {
    assertValid(tx)
  })

  it('verifies valid TokenConvert from an MPT', function () {
    tx.Amount = { mpt_issuance_id: ISSUER_MPT_ID, value: '125' }
    assertValid(tx)
  })

  it('throws w/ missing Amount', function () {
    // @ts-expect-error for test
    tx.Amount = undefined
    assertInvalid(tx, 'TokenConvert: missing field Amount')
  })

  it('throws w/ invalid Amount', function () {
    // @ts-expect-error for test
    tx.Amount = { currency: 'USD' }
    assertInvalid(tx, 'TokenConvert: invalid field Amount')
  })

  it('throws w/ an XRP Amount', function () {
    // @ts-expect-error for test
    tx.Amount = '1000'
    assertInvalid(tx, 'TokenConvert: Amount must be an IOU or MPT amount')
  })

  it('throws w/ zero Amount', function () {
    tx.Amount = { currency: 'USD', issuer: ISSUER, value: '0' }
    assertInvalid(tx, 'TokenConvert: Amount must be positive')
  })

  it('throws w/ negative MPT Amount', function () {
    tx.Amount = { mpt_issuance_id: ISSUER_MPT_ID, value: '-5' }
    assertInvalid(tx, 'TokenConvert: Amount must be positive')
  })

  it('throws w/ the Account as the IOU issuer', function () {
    tx.Amount = {
      currency: 'USD',
      issuer: 'rfmDuhDyLGgx94qiwf3YF8BUV5j6KSvE8',
      value: '1',
    }
    assertInvalid(tx, 'TokenConvert: the issuer cannot convert its own token')
  })

  it('throws w/ the Account as the MPT issuer', function () {
    tx.Amount = { mpt_issuance_id: ACCOUNT_MPT_ID, value: '1' }
    assertInvalid(tx, 'TokenConvert: the issuer cannot convert its own token')
  })

  it('throws w/ an unknown flag', function () {
    tx.Flags = 0x00010000
    assertInvalid(tx, 'TokenConvert: invalid Flags')
  })
})
