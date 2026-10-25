import { stringToHex } from '@xrplf/isomorphic/utils'

import {
  TokenIssuanceSet,
  TokenIssuanceSetFlags,
} from '../../src/models/transactions'
import { validateTokenIssuanceSet } from '../../src/models/transactions/tokenIssuanceSet'
import { assertTxIsValid, assertTxValidationError } from '../testUtils'

const assertValid = (tx: any): void =>
  assertTxIsValid(tx, validateTokenIssuanceSet)
const assertInvalid = (tx: any, message: string): void =>
  assertTxValidationError(tx, validateTokenIssuanceSet, message)

/**
 * TokenIssuanceSet Transaction Verification Testing.
 *
 * Providing runtime verification testing for each specific transaction type.
 */
describe('TokenIssuanceSet', function () {
  let tx: TokenIssuanceSet

  beforeEach(function () {
    tx = {
      TransactionType: 'TokenIssuanceSet',
      Account: 'rfmDuhDyLGgx94qiwf3YF8BUV5j6KSvE8',
      Currency: 'USD',
    }
  })

  it('verifies valid TokenIssuanceSet', function () {
    assertValid(tx)
  })

  it('verifies valid TokenIssuanceSet with every optional field', function () {
    tx.MPTokenIssuanceID = '0000000101476926B590BA3245F63C829116A0A3AF7F382D'
    tx.TransferFee = 0
    tx.MPTokenMetadata = stringToHex('a'.repeat(1024))
    assertValid(tx)
  })

  it('verifies valid tfTokenLock', function () {
    tx.Flags = TokenIssuanceSetFlags.tfTokenLock
    assertValid(tx)
  })

  it('verifies valid tfTokenUnlock with tfTokenCannotLock', function () {
    tx.Flags = { tfTokenUnlock: true, tfTokenCannotLock: true }
    assertValid(tx)
  })

  it('verifies XRP as Currency, which only preclaim rejects', function () {
    tx.Currency = 'XRP'
    assertValid(tx)
  })

  it('throws w/ missing Currency', function () {
    // @ts-expect-error for test
    tx.Currency = undefined
    assertInvalid(tx, 'TokenIssuanceSet: missing field Currency')
  })

  it('throws w/ malformed Currency', function () {
    tx.Currency = 'US'
    assertInvalid(tx, 'TokenIssuanceSet: invalid field Currency')
  })

  it('throws w/ tfTokenLock and tfTokenUnlock', function () {
    tx.Flags =
      TokenIssuanceSetFlags.tfTokenLock + TokenIssuanceSetFlags.tfTokenUnlock
    assertInvalid(
      tx,
      'TokenIssuanceSet: tfTokenLock and tfTokenUnlock cannot both be set',
    )
  })

  it('throws w/ tfTokenCannotLock and tfTokenLock', function () {
    tx.Flags = { tfTokenCannotLock: true, tfTokenLock: true }
    assertInvalid(
      tx,
      'TokenIssuanceSet: tfTokenCannotLock and tfTokenLock cannot both be set',
    )
  })

  it('throws w/ an unknown flag', function () {
    tx.Flags = 0x00000008
    assertInvalid(tx, 'TokenIssuanceSet: invalid Flags')
  })

  it('throws w/ non-number TransferFee', function () {
    // @ts-expect-error for test
    tx.TransferFee = '1'
    assertInvalid(tx, 'TokenIssuanceSet: invalid field TransferFee')
  })

  it('throws w/ TransferFee above 50000', function () {
    tx.TransferFee = 50001
    assertInvalid(
      tx,
      'TokenIssuanceSet: TransferFee must be an integer between 0 and 50000',
    )
  })

  it('throws w/ empty MPTokenMetadata', function () {
    tx.MPTokenMetadata = ''
    assertInvalid(
      tx,
      'TokenIssuanceSet: MPTokenMetadata must be a non-empty hex string of at most 1024 bytes',
    )
  })

  it('throws w/ MPTokenMetadata above 1024 bytes', function () {
    tx.MPTokenMetadata = stringToHex('a'.repeat(1025))
    assertInvalid(
      tx,
      'TokenIssuanceSet: MPTokenMetadata must be a non-empty hex string of at most 1024 bytes',
    )
  })

  it('throws w/ invalid MPTokenIssuanceID', function () {
    tx.MPTokenIssuanceID = 'XYZ'
    assertInvalid(tx, 'TokenIssuanceSet: invalid field MPTokenIssuanceID')
  })
})
