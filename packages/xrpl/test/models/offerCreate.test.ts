import {
  OfferCreateFlags,
  validateOfferCreate,
} from '../../src/models/transactions/offerCreate'
import { assertTxIsValid, assertTxValidationError } from '../testUtils'

const assertValid = (tx: any): void => assertTxIsValid(tx, validateOfferCreate)
const assertInvalid = (tx: any, message: string): void =>
  assertTxValidationError(tx, validateOfferCreate, message)

/**
 * OfferCreate Transaction Verification Testing.
 *
 * Providing runtime verification testing for each specific transaction type.
 */
describe('OfferCreate', function () {
  it(`verifies valid OfferCreate`, function () {
    const offerTx = {
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
    }

    assertValid(offerTx)
  })

  it(`verifies valid OfferCreate with flags`, function () {
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

    assertValid(offer2)
  })

  it(`verifies valid OfferCreate with TakerGets and TakerPays as IOUs`, function () {
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

    assertValid(offer3)
  })

  it(`verfies valid offerCreate within permissioned domain`, function () {
    const offerTx = {
      Account: 'r3rhWeE31Jt5sWmi4QiGLMZnY3ENgqw96W',
      Flags: 0,
      Expiration: 10,
      DomainID:
        '5D0177045A8750FC5892032A3BA15885B38A88BE315B7DF6A44BB24D67141180',
      TakerGets: {
        currency: 'DSH',
        issuer: 'rcXY84C4g14iFp6taFXjjQGVeHqSCh9RX',
        value: '43.11584856965009',
      },
      TakerPays: '12928290425',
      TransactionType: 'OfferCreate',
    } as any

    assertValid(offerTx)
  })

  it(`throws -- invalid DomainID type`, function () {
    const offerTx = {
      Account: 'r3rhWeE31Jt5sWmi4QiGLMZnY3ENgqw96W',
      DomainID: { sampleDictKey: 1 },
      TakerGets: {
        currency: 'DSH',
        issuer: 'rcXY84C4g14iFp6taFXjjQGVeHqSCh9RX',
        value: '43.11584856965009',
      },
      TakerPays: '12928290425',
      TransactionType: 'OfferCreate',
    } as any

    assertInvalid(offerTx, 'OfferCreate: invalid field DomainID')
  })

  it(`throws -- invalid DomainID , exceeds expected length`, function () {
    const offerTx = {
      Account: 'r3rhWeE31Jt5sWmi4QiGLMZnY3ENgqw96W',
      DomainID: '5'.repeat(65),
      TakerGets: {
        currency: 'DSH',
        issuer: 'rcXY84C4g14iFp6taFXjjQGVeHqSCh9RX',
        value: '43.11584856965009',
      },
      TakerPays: '12928290425',
      TransactionType: 'OfferCreate',
    } as any

    assertInvalid(offerTx, 'OfferCreate: invalid field DomainID')
  })

  it(`throws -- invalid DomainID , falls short of expected length`, function () {
    const offerTx = {
      Account: 'r3rhWeE31Jt5sWmi4QiGLMZnY3ENgqw96W',
      DomainID: '5'.repeat(63),
      TakerGets: {
        currency: 'DSH',
        issuer: 'rcXY84C4g14iFp6taFXjjQGVeHqSCh9RX',
        value: '43.11584856965009',
      },
      TakerPays: '12928290425',
      TransactionType: 'OfferCreate',
    } as any

    assertInvalid(offerTx, 'OfferCreate: invalid field DomainID')
  })

  it(`throws -- invalid flag (interface) specified without DomainID`, function () {
    const offerTx = {
      Account: 'r3rhWeE31Jt5sWmi4QiGLMZnY3ENgqw96W',
      Flags: OfferCreateFlags.tfHybrid,
      TakerGets: {
        currency: 'DSH',
        issuer: 'rcXY84C4g14iFp6taFXjjQGVeHqSCh9RX',
        value: '43.11584856965009',
      },
      TakerPays: '12928290425',
      TransactionType: 'OfferCreate',
    } as any

    assertInvalid(
      offerTx,
      'OfferCreate: tfHybrid flag cannot be set if DomainID is not present',
    )
  })

  it(`throws -- invalid flag (number) specified without DomainID`, function () {
    const offerTx = {
      Account: 'r3rhWeE31Jt5sWmi4QiGLMZnY3ENgqw96W',
      Flags: 0x00100000,
      TakerGets: {
        currency: 'DSH',
        issuer: 'rcXY84C4g14iFp6taFXjjQGVeHqSCh9RX',
        value: '43.11584856965009',
      },
      TakerPays: '12928290425',
      TransactionType: 'OfferCreate',
    } as any

    assertInvalid(
      offerTx,
      'OfferCreate: tfHybrid flag cannot be set if DomainID is not present',
    )
  })

  it(`throws w/ invalid Expiration`, function () {
    const offerTx = {
      Account: 'r3rhWeE31Jt5sWmi4QiGLMZnY3ENgqw96W',
      Fee: '10',
      Flags: 0,
      LastLedgerSequence: 65453019,
      Sequence: 40949322,
      SigningPubKey:
        '03C48299E57F5AE7C2BE1391B581D313F1967EA2301628C07AC412092FDC15BA22',
      Expiration: '11',
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

    assertInvalid(offerTx, 'OfferCreate: invalid field Expiration')
  })

  it(`throws w/ invalid OfferSequence`, function () {
    const offerTx = {
      Account: 'r3rhWeE31Jt5sWmi4QiGLMZnY3ENgqw96W',
      Fee: '10',
      Flags: 0,
      LastLedgerSequence: 65453019,
      Sequence: 40949322,
      SigningPubKey:
        '03C48299E57F5AE7C2BE1391B581D313F1967EA2301628C07AC412092FDC15BA22',
      OfferSequence: '11',
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

    assertInvalid(offerTx, 'OfferCreate: invalid field OfferSequence')
  })

  it(`throws w/ invalid TakerPays`, function () {
    const offerTx = {
      Account: 'r3rhWeE31Jt5sWmi4QiGLMZnY3ENgqw96W',
      Fee: '10',
      Flags: 0,
      LastLedgerSequence: 65453019,
      Sequence: 40949322,
      SigningPubKey:
        '03C48299E57F5AE7C2BE1391B581D313F1967EA2301628C07AC412092FDC15BA22',
      OfferSequence: '11',
      TakerGets: '12928290425',
      TakerPays: 10,
      TransactionType: 'OfferCreate',
      TxnSignature:
        '3045022100D874CDDD6BB24ED66E83B1D3574D3ECAC753A78F26DB7EBA89EAB8E7D72B95F802207C8CCD6CEA64E4AE2014E59EE9654E02CA8F03FE7FCE0539E958EAE182234D91',
    } as any

    assertInvalid(offerTx, 'OfferCreate: invalid field TakerPays')
  })

  it(`throws w/ invalid TakerGets`, function () {
    const offerTx = {
      Account: 'r3rhWeE31Jt5sWmi4QiGLMZnY3ENgqw96W',
      Fee: '10',
      Flags: 0,
      LastLedgerSequence: 65453019,
      Sequence: 40949322,
      SigningPubKey:
        '03C48299E57F5AE7C2BE1391B581D313F1967EA2301628C07AC412092FDC15BA22',
      OfferSequence: '11',
      TakerGets: 11,
      TakerPays: {
        currency: 'DSH',
        issuer: 'rcXY84C4g14iFp6taFXjjQGVeHqSCh9RX',
        value: '43.11584856965009',
      },
      TransactionType: 'OfferCreate',
      TxnSignature:
        '3045022100D874CDDD6BB24ED66E83B1D3574D3ECAC753A78F26DB7EBA89EAB8E7D72B95F802207C8CCD6CEA64E4AE2014E59EE9654E02CA8F03FE7FCE0539E958EAE182234D91',
    } as any

    assertInvalid(offerTx, 'OfferCreate: invalid field TakerGets')
  })

  describe('OfferQualifiers', function () {
    const USD = {
      currency: 'USD',
      issuer: 'rcXY84C4g14iFp6taFXjjQGVeHqSCh9RX',
    }
    const MPT_ID = '000004C463C52827307480341125DA0577DEFC38405B0E3E'
    let tx: any

    beforeEach(function () {
      tx = {
        TransactionType: 'OfferCreate',
        Account: 'r3rhWeE31Jt5sWmi4QiGLMZnY3ENgqw96W',
        TakerGets: { ...USD, value: '100' },
        TakerPays: '12928290425',
      }
    })

    it('verifies tfAllOrNone', function () {
      tx.Flags = OfferCreateFlags.tfAllOrNone
      assertValid(tx)
      tx.Flags = { tfAllOrNone: true, tfPassive: true }
      assertValid(tx)
    })

    it('verifies tfPostOnly', function () {
      tx.Flags = OfferCreateFlags.tfPostOnly
      assertValid(tx)
      tx.Flags = { tfPostOnly: true, tfAllOrNone: true }
      assertValid(tx)
    })

    it('verifies an IOU MinQuantity below and equal to TakerGets', function () {
      tx.MinQuantity = { ...USD, value: '10.5' }
      assertValid(tx)
      tx.MinQuantity = { ...USD, value: '1e2' }
      assertValid(tx)
    })

    it('verifies an XRP MinQuantity with XRP TakerGets', function () {
      tx.TakerGets = '1000000'
      tx.TakerPays = { ...USD, value: '1' }
      tx.MinQuantity = '500000'
      assertValid(tx)
    })

    it('verifies an MPT MinQuantity with MPT TakerGets', function () {
      tx.TakerGets = { mpt_issuance_id: MPT_ID, value: '1000' }
      tx.MinQuantity = { mpt_issuance_id: MPT_ID, value: '1' }
      assertValid(tx)
    })

    it('throws w/ tfAllOrNone and tfImmediateOrCancel', function () {
      tx.Flags = {
        tfAllOrNone: true,
        tfImmediateOrCancel: true,
      }
      assertInvalid(
        tx,
        'OfferCreate: tfAllOrNone cannot be combined with tfImmediateOrCancel or tfFillOrKill',
      )
    })

    it('throws w/ tfAllOrNone and tfFillOrKill', function () {
      tx.Flags = OfferCreateFlags.tfAllOrNone + OfferCreateFlags.tfFillOrKill
      assertInvalid(
        tx,
        'OfferCreate: tfAllOrNone cannot be combined with tfImmediateOrCancel or tfFillOrKill',
      )
    })

    it('throws w/ tfPostOnly and tfImmediateOrCancel', function () {
      tx.Flags = { tfPostOnly: true, tfImmediateOrCancel: true }
      assertInvalid(
        tx,
        'OfferCreate: tfPostOnly cannot be combined with tfImmediateOrCancel, tfFillOrKill or tfSell',
      )
    })

    it('throws w/ tfPostOnly and tfFillOrKill', function () {
      tx.Flags = { tfPostOnly: true, tfFillOrKill: true }
      assertInvalid(
        tx,
        'OfferCreate: tfPostOnly cannot be combined with tfImmediateOrCancel, tfFillOrKill or tfSell',
      )
    })

    it('throws w/ tfPostOnly and tfSell', function () {
      tx.Flags = { tfPostOnly: true, tfSell: true }
      assertInvalid(
        tx,
        'OfferCreate: tfPostOnly cannot be combined with tfImmediateOrCancel, tfFillOrKill or tfSell',
      )
    })

    it('throws w/ tfAllOrNone and MinQuantity', function () {
      tx.Flags = { tfAllOrNone: true }
      tx.MinQuantity = { ...USD, value: '1' }
      assertInvalid(
        tx,
        'OfferCreate: MinQuantity cannot be set together with tfAllOrNone',
      )
    })

    it('throws w/ invalid MinQuantity', function () {
      tx.MinQuantity = { currency: 'USD' }
      assertInvalid(tx, 'OfferCreate: invalid field MinQuantity')
    })

    it('throws w/ MinQuantity in another currency', function () {
      tx.MinQuantity = { ...USD, currency: 'EUR', value: '1' }
      assertInvalid(
        tx,
        'OfferCreate: MinQuantity must be in the TakerGets asset',
      )
    })

    it('throws w/ MinQuantity from another issuer', function () {
      tx.MinQuantity = {
        ...USD,
        issuer: 'r3rhWeE31Jt5sWmi4QiGLMZnY3ENgqw96W',
        value: '1',
      }
      assertInvalid(
        tx,
        'OfferCreate: MinQuantity must be in the TakerGets asset',
      )
    })

    it('throws w/ XRP MinQuantity for IOU TakerGets', function () {
      tx.MinQuantity = '1'
      assertInvalid(
        tx,
        'OfferCreate: MinQuantity must be in the TakerGets asset',
      )
    })

    it('throws w/ MinQuantity of another MPT issuance', function () {
      tx.TakerGets = { mpt_issuance_id: MPT_ID, value: '1000' }
      tx.MinQuantity = {
        mpt_issuance_id: '000004C463C52827307480341125DA0577DEFC38405B0E3F',
        value: '1',
      }
      assertInvalid(
        tx,
        'OfferCreate: MinQuantity must be in the TakerGets asset',
      )
    })

    it('throws w/ a zero MinQuantity', function () {
      tx.MinQuantity = { ...USD, value: '0' }
      assertInvalid(
        tx,
        'OfferCreate: MinQuantity must be greater than 0 and no more than TakerGets',
      )
    })

    it('throws w/ a negative MinQuantity', function () {
      tx.MinQuantity = { ...USD, value: '-1' }
      assertInvalid(
        tx,
        'OfferCreate: MinQuantity must be greater than 0 and no more than TakerGets',
      )
    })

    it('throws w/ MinQuantity above TakerGets', function () {
      tx.MinQuantity = { ...USD, value: '100.0001' }
      assertInvalid(
        tx,
        'OfferCreate: MinQuantity must be greater than 0 and no more than TakerGets',
      )
    })
  })
})
