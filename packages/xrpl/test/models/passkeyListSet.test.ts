import { PasskeyListSet } from '../../src/models/transactions'
import { validatePasskeyListSet } from '../../src/models/transactions/passkeyListSet'
import { assertTxIsValid, assertTxValidationError } from '../testUtils'

const assertValid = (tx: any): void =>
  assertTxIsValid(tx, validatePasskeyListSet)
const assertInvalid = (tx: any, message: string): void =>
  assertTxValidationError(tx, validatePasskeyListSet, message)

const P256_KEY_BODY_HEX_LENGTH = 128

/**
 * Build a 65-byte P256 public key in the node's encoding (prefix 0xF6).
 *
 * @param fill - The hex digit repeated through the key body.
 * @returns The public key as hex.
 */
function p256Key(fill: string): string {
  return `F6${fill.repeat(P256_KEY_BODY_HEX_LENGTH)}`
}

/**
 * Build one Passkeys array element.
 *
 * @param passkeyID - The credential ID as hex.
 * @param publicKey - The public key as hex.
 * @returns The wrapped Passkey inner object.
 */
function passkey(
  passkeyID: string,
  publicKey: string,
): PasskeyListSet['Passkeys'][number] {
  return { Passkey: { PasskeyID: passkeyID, PublicKey: publicKey } }
}

/**
 * PasskeyListSet Transaction Verification Testing.
 *
 * Providing runtime verification testing for each specific transaction type.
 */
describe('PasskeyListSet', function () {
  let tx: PasskeyListSet

  beforeEach(function () {
    tx = {
      TransactionType: 'PasskeyListSet',
      Account: 'rfmDuhDyLGgx94qiwf3YF8BUV5j6KSvE8',
      Passkeys: [passkey('A1B2C3D4', p256Key('1'))],
    }
  })

  it('verifies valid PasskeyListSet', function () {
    assertValid(tx)
  })

  it('verifies valid PasskeyListSet with several passkeys', function () {
    tx.Passkeys = [
      passkey('A1B2C3D4', p256Key('1')),
      passkey('a1b2c3d5', p256Key('2')),
    ]
    assertValid(tx)
  })

  it('throws w/ missing Passkeys', function () {
    // @ts-expect-error for test
    tx.Passkeys = undefined
    assertInvalid(tx, 'PasskeyListSet: missing field Passkeys')
  })

  it('throws w/ invalid Passkeys', function () {
    // @ts-expect-error for test
    tx.Passkeys = 'not an array'
    assertInvalid(tx, 'PasskeyListSet: invalid field Passkeys')
  })

  it('throws w/ empty Passkeys', function () {
    tx.Passkeys = []
    assertInvalid(tx, 'PasskeyListSet: Passkeys must not be empty')
  })

  it('throws w/ Passkeys element that is not a Passkey object', function () {
    // @ts-expect-error for test
    tx.Passkeys = [{ PasskeyID: 'A1B2C3D4', PublicKey: p256Key('1') }]
    assertInvalid(
      tx,
      'PasskeyListSet: each Passkeys element must be a Passkey object',
    )

    // @ts-expect-error for test
    tx.Passkeys = [{ Passkey: passkey('A1', p256Key('1')).Passkey, Other: 1 }]
    assertInvalid(
      tx,
      'PasskeyListSet: each Passkeys element must be a Passkey object',
    )
  })

  it('throws w/ missing PasskeyID', function () {
    // @ts-expect-error for test
    tx.Passkeys = [{ Passkey: { PublicKey: p256Key('1') } }]
    assertInvalid(tx, 'PasskeyListSet: Passkey missing field PasskeyID')
  })

  it('throws w/ missing PublicKey', function () {
    // @ts-expect-error for test
    tx.Passkeys = [{ Passkey: { PasskeyID: 'A1B2C3D4' } }]
    assertInvalid(tx, 'PasskeyListSet: Passkey missing field PublicKey')
  })

  it('throws w/ PasskeyID that is not hex', function () {
    tx.Passkeys = [passkey('XYZ', p256Key('1'))]
    assertInvalid(tx, 'PasskeyListSet: Passkey invalid field PasskeyID')

    tx.Passkeys = [passkey('ABC', p256Key('1'))]
    assertInvalid(tx, 'PasskeyListSet: Passkey invalid field PasskeyID')
  })

  it('throws w/ PublicKey that is not hex', function () {
    tx.Passkeys = [passkey('A1B2C3D4', 'not hex')]
    assertInvalid(tx, 'PasskeyListSet: Passkey invalid field PublicKey')
  })

  it('throws w/ duplicate PasskeyID', function () {
    tx.Passkeys = [
      passkey('A1B2C3D4', p256Key('1')),
      passkey('a1b2c3d4', p256Key('2')),
    ]
    assertInvalid(tx, 'PasskeyListSet: duplicate PasskeyID')
  })

  it('throws w/ duplicate PublicKey', function () {
    tx.Passkeys = [
      passkey('A1B2C3D4', p256Key('a')),
      passkey('A1B2C3D5', p256Key('A')),
    ]
    assertInvalid(tx, 'PasskeyListSet: duplicate PublicKey')
  })

  it('throws w/ PublicKey that is not a P256 key', function () {
    const ed25519Key =
      'EDF9096653463E3A0B79A67E69D9E66AB83D93D4E867335ADE5DAFE8467F4F1734'
    tx.Passkeys = [passkey('A1B2C3D4', ed25519Key)]
    assertInvalid(tx, 'PasskeyListSet: PublicKey must be a P256 public key')

    tx.Passkeys = [passkey('A1B2C3D4', `04${'1'.repeat(128)}`)]
    assertInvalid(tx, 'PasskeyListSet: PublicKey must be a P256 public key')

    tx.Passkeys = [passkey('A1B2C3D4', `F6${'1'.repeat(126)}`)]
    assertInvalid(tx, 'PasskeyListSet: PublicKey must be a P256 public key')
  })
})
