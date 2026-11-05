import { validatePaymentChannelClaim } from '../../src/models/transactions/paymentChannelClaim'
import { assertTxIsValid, assertTxValidationError } from '../testUtils'

const assertValid = (tx: any): void =>
  assertTxIsValid(tx, validatePaymentChannelClaim)
const assertInvalid = (tx: any, message: string): void =>
  assertTxValidationError(tx, validatePaymentChannelClaim, message)

/**
 * PaymentChannelClaim Transaction Verification Testing.
 *
 * Providing runtime verification testing for each specific transaction type.
 */
describe('PaymentChannelClaim', function () {
  let channel: any

  beforeEach(function () {
    channel = {
      Account: 'rB5Ux4Lv2nRx6eeoAAsZmtctnBQ2LiACnk',
      TransactionType: 'PaymentChannelClaim',
      Channel:
        'C1AE6DDDEEC05CF2978C0BAD6FE302948E9533691DC749DCDD3B9E5992CA6198',
      Balance: '1000000',
      Amount: '1000000',
      Signature:
        '30440220718D264EF05CAED7C781FF6DE298DCAC68D002562C9BF3A07C1E721B420C0DAB02203A5A4779EF4D2CCC7BC3EF886676D803A9981B928D3B8ACA483B80ECA3CD7B9B',
      PublicKey:
        '32D2471DB72B27E3310F355BB33E339BF26F8392D5A93D3BC0FC3B566612DA0F0A',
    }
  })

  it(`verifies valid PaymentChannelClaim`, function () {
    assertValid(channel)
  })

  it(`verifies valid PaymentChannelClaim w/o optional`, function () {
    delete channel.Balance
    delete channel.Amount
    delete channel.Signature
    delete channel.PublicKey

    assertValid(channel)
  })

  it(`throws w/ missing Channel`, function () {
    delete channel.Channel

    assertInvalid(channel, 'PaymentChannelClaim: missing field Channel')
  })

  it(`throws w/ invalid Channel`, function () {
    channel.Channel = 100

    assertInvalid(channel, 'PaymentChannelClaim: invalid field Channel')
  })

  it(`throws w/ invalid Balance`, function () {
    channel.Balance = 100

    assertInvalid(
      channel,
      'PaymentChannelClaim: Balance must be an XRP, IOU or MPT amount',
    )
  })

  it(`throws w/ invalid Amount`, function () {
    channel.Amount = 1000

    assertInvalid(
      channel,
      'PaymentChannelClaim: Amount must be an XRP, IOU or MPT amount',
    )
  })

  it(`throws w/ invalid Signature`, function () {
    channel.Signature = 1000

    assertInvalid(channel, 'PaymentChannelClaim: invalid field Signature')
  })

  it(`throws w/ invalid PublicKey`, function () {
    channel.PublicKey = ['100000']

    assertInvalid(channel, 'PaymentChannelClaim: invalid field PublicKey')
  })

  it(`throws w/ non-hex Channel`, function () {
    channel.Channel = 'not hex'
    assertInvalid(channel, 'PaymentChannelClaim: invalid field Channel')
  })

  it(`throws w/ non-hex Signature`, function () {
    channel.Signature = 'not hex'
    assertInvalid(channel, 'PaymentChannelClaim: invalid field Signature')
  })

  it(`throws w/ non-hex PublicKey`, function () {
    channel.PublicKey = 'not hex'
    assertInvalid(channel, 'PaymentChannelClaim: invalid field PublicKey')
  })

  describe('token amounts (TokenPaychan)', function () {
    it(`verifies an IOU Balance`, function () {
      delete channel.Amount
      channel.Balance = {
        currency: 'USD',
        issuer: 'rcXY84C4g14iFp6taFXjjQGVeHqSCh9RX',
        value: '100.5',
      }

      assertValid(channel)
    })

    it(`verifies an MPT Balance`, function () {
      delete channel.Amount
      channel.Balance = {
        mpt_issuance_id: '000004C463C52827307480341125DA0577DEFC38405B0E3E',
        value: '100',
      }

      assertValid(channel)
    })

    it(`throws w/ a zero XRP Balance`, function () {
      channel.Balance = '0'

      assertInvalid(
        channel,
        'PaymentChannelClaim: Balance must be greater than 0',
      )
    })

    it(`throws w/ a negative IOU Balance`, function () {
      delete channel.Amount
      channel.Balance = {
        currency: 'USD',
        issuer: 'rcXY84C4g14iFp6taFXjjQGVeHqSCh9RX',
        value: '-1',
      }

      assertInvalid(
        channel,
        'PaymentChannelClaim: Balance must be greater than 0',
      )
    })

    it(`throws w/ a zero MPT Balance`, function () {
      delete channel.Amount
      channel.Balance = {
        mpt_issuance_id: '000004C463C52827307480341125DA0577DEFC38405B0E3E',
        value: '0',
      }

      assertInvalid(
        channel,
        'PaymentChannelClaim: Balance must be greater than 0',
      )
    })

    it(`throws w/ a malformed token Balance`, function () {
      channel.Balance = { currency: 'USD' }

      assertInvalid(
        channel,
        'PaymentChannelClaim: Balance must be an XRP, IOU or MPT amount',
      )
    })

    it(`verifies an IOU Amount`, function () {
      delete channel.Balance
      delete channel.Signature
      channel.Amount = {
        currency: 'USD',
        issuer: 'rcXY84C4g14iFp6taFXjjQGVeHqSCh9RX',
        value: '100.5',
      }

      assertValid(channel)
    })

    it(`verifies an MPT Amount`, function () {
      delete channel.Balance
      delete channel.Signature
      channel.Amount = {
        mpt_issuance_id: '000004C463C52827307480341125DA0577DEFC38405B0E3E',
        value: '100',
      }

      assertValid(channel)
    })

    it(`throws w/ a zero XRP Amount`, function () {
      channel.Amount = '0'

      assertInvalid(
        channel,
        'PaymentChannelClaim: Amount must be greater than 0',
      )
    })

    it(`throws w/ a negative IOU Amount`, function () {
      delete channel.Balance
      delete channel.Signature
      channel.Amount = {
        currency: 'USD',
        issuer: 'rcXY84C4g14iFp6taFXjjQGVeHqSCh9RX',
        value: '-1',
      }

      assertInvalid(
        channel,
        'PaymentChannelClaim: Amount must be greater than 0',
      )
    })

    it(`throws w/ a zero MPT Amount`, function () {
      delete channel.Balance
      delete channel.Signature
      channel.Amount = {
        mpt_issuance_id: '000004C463C52827307480341125DA0577DEFC38405B0E3E',
        value: '0',
      }

      assertInvalid(
        channel,
        'PaymentChannelClaim: Amount must be greater than 0',
      )
    })

    it(`throws w/ a malformed token Amount`, function () {
      channel.Amount = { currency: 'USD' }

      assertInvalid(
        channel,
        'PaymentChannelClaim: Amount must be an XRP, IOU or MPT amount',
      )
    })

    it(`verifies IOU Balance and Amount in the same asset`, function () {
      channel.Balance = {
        currency: 'USD',
        issuer: 'rcXY84C4g14iFp6taFXjjQGVeHqSCh9RX',
        value: '10',
      }
      channel.Amount = {
        currency: 'USD',
        issuer: 'rcXY84C4g14iFp6taFXjjQGVeHqSCh9RX',
        value: '10',
      }

      assertValid(channel)
    })

    it(`throws w/ Balance and Amount in different assets`, function () {
      channel.Balance = '1000000'
      channel.Amount = {
        currency: 'USD',
        issuer: 'rcXY84C4g14iFp6taFXjjQGVeHqSCh9RX',
        value: '10',
      }

      assertInvalid(
        channel,
        'PaymentChannelClaim: Balance and Amount must be in the same asset',
      )
    })

    it(`throws w/ Balance and Amount of different MPT issuances`, function () {
      channel.Balance = {
        mpt_issuance_id: '000004C463C52827307480341125DA0577DEFC38405B0E3E',
        value: '1',
      }
      channel.Amount = {
        mpt_issuance_id: '000004C463C52827307480341125DA0577DEFC38405B0E3F',
        value: '1',
      }

      assertInvalid(
        channel,
        'PaymentChannelClaim: Balance and Amount must be in the same asset',
      )
    })

    it(`throws w/ an XRP Balance above Amount`, function () {
      channel.Balance = '1000001'

      assertInvalid(
        channel,
        'PaymentChannelClaim: Balance cannot exceed Amount',
      )
    })

    it(`throws w/ an IOU Balance above Amount`, function () {
      channel.Balance = {
        currency: 'USD',
        issuer: 'rcXY84C4g14iFp6taFXjjQGVeHqSCh9RX',
        value: '10.01',
      }
      channel.Amount = {
        currency: 'USD',
        issuer: 'rcXY84C4g14iFp6taFXjjQGVeHqSCh9RX',
        value: '10',
      }

      assertInvalid(
        channel,
        'PaymentChannelClaim: Balance cannot exceed Amount',
      )
    })
  })
})
