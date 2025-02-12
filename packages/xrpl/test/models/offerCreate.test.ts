import { assert } from 'chai'

import { validate, ValidationError } from '../../src'
import { validateOfferCreate } from '../../src/models/transactions/offerCreate'

/**
 * OfferCreate Transaction Verification Testing.
 *
 * Providing runtime verification testing for each specific transaction type.
 */
describe('OfferCreate', function () {
  let offer

  beforeEach(function () {
    offer = {
      Account: 'r3rhWeE31Jt5sWmi4QiGLMZnY3ENgqw96W',
      Fee: '10',
      Flags: 0,
      LastLedgerSequence: 65453019,
      Sequence: 40949322,
      SigningPubKey:
        '03C48299E57F5AE7C2BE1391B581D313F1967EA2301628C07AC412092FDC15BA22',
      Expiration: 10,
      OfferSequence: 12,
      TakerGets: {
        currency: 'DSH',
        issuer: 'rcXY84C4g14iFp6taFXjjQGVeHqSCh9RX',
        value: '43.11584856965009',
      },
      TakerPays: '12928290425',
      TransactionType: 'OfferCreate',
      TxnSignature:
        '3045022100D874CDDD6BB24ED66E83B1D3574D3ECAC753A78F26DB7EBA89EAB8E7D72B95F802207C8CCD6CEA64E4AE2014E59EE9654E02CA8F03FE7FCE0539E958EAE182234D91',
    } as any
  })
  it(`verifies valid OfferCreate`, function () {
    assert.doesNotThrow(() => validateOfferCreate(offer))
    assert.doesNotThrow(() => validate(offer))

    const offer2 = {
      Account: 'r3rhWeE31Jt5sWmi4QiGLMZnY3ENgqw96W',
      Fee: '10',
      Flags: 0,
      LastLedgerSequence: 65453019,
      Sequence: 40949322,
      SigningPubKey:
        '03C48299E57F5AE7C2BE1391B581D313F1967EA2301628C07AC412092FDC15BA22',
      TakerGets: '12928290425',
      TakerPays: {
        currency: 'DSH',
        issuer: 'rcXY84C4g14iFp6taFXjjQGVeHqSCh9RX',
        value: '43.11584856965009',
      },
      TransactionType: 'OfferCreate',
      TxnSignature:
        '3045022100D874CDDD6BB24ED66E83B1D3574D3ECAC753A78F26DB7EBA89EAB8E7D72B95F802207C8CCD6CEA64E4AE2014E59EE9654E02CA8F03FE7FCE0539E958EAE182234D91',
    } as any

    assert.doesNotThrow(() => validateOfferCreate(offer2))
    assert.doesNotThrow(() => validate(offer2))

    const offer3 = {
      Account: 'r3rhWeE31Jt5sWmi4QiGLMZnY3ENgqw96W',
      Fee: '10',
      Flags: 0,
      LastLedgerSequence: 65453019,
      Sequence: 40949322,
      SigningPubKey:
        '03C48299E57F5AE7C2BE1391B581D313F1967EA2301628C07AC412092FDC15BA22',
      TakerGets: {
        currency: 'DSH',
        issuer: 'rcXY84C4g14iFp6taFXjjQGVeHqSCh9RX',
        value: '43.11584856965009',
      },
      TakerPays: {
        currency: 'DSH',
        issuer: 'rcXY84C4g14iFp6taFXjjQGVeHqSCh9RX',
        value: '43.11584856965009',
      },
      TransactionType: 'OfferCreate',
      TxnSignature:
        '3045022100D874CDDD6BB24ED66E83B1D3574D3ECAC753A78F26DB7EBA89EAB8E7D72B95F802207C8CCD6CEA64E4AE2014E59EE9654E02CA8F03FE7FCE0539E958EAE182234D91',
    } as any

    assert.doesNotThrow(() => validateOfferCreate(offer3))
    assert.doesNotThrow(() => validate(offer3))
  })

  it(`throws w/ invalid Expiration`, function () {
    offer.Expiration = 'abcd'

    assert.throws(
      () => validateOfferCreate(offer),
      ValidationError,
      'OfferCreate: invalid field Expiration',
    )
    assert.throws(
      () => validate(offer),
      ValidationError,
      'OfferCreate: invalid field Expiration',
    )
  })

  it(`throws w/ invalid OfferSequence`, function () {
    offer.OfferSequence = 'abcd'

    assert.throws(
      () => validateOfferCreate(offer),
      ValidationError,
      'OfferCreate: invalid field OfferSequence',
    )
    assert.throws(
      () => validate(offer),
      ValidationError,
      'OfferCreate: invalid field OfferSequence',
    )
  })

  it(`throws w/ invalid TakerPays`, function () {
    offer.TakerPays = 10

    assert.throws(
      () => validateOfferCreate(offer),
      ValidationError,
      'OfferCreate: invalid field TakerPays',
    )
    assert.throws(
      () => validate(offer),
      ValidationError,
      'OfferCreate: invalid field TakerPays',
    )
  })

  it(`throws w/ invalid TakerGets`, function () {
    offer.TakerGets = 11

    assert.throws(
      () => validateOfferCreate(offer),
      ValidationError,
      'OfferCreate: invalid field TakerGets',
    )
    assert.throws(
      () => validate(offer),
      ValidationError,
      'OfferCreate: invalid field TakerGets',
    )
  })
})
