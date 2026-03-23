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

    assertInvalid(channel, 'PaymentChannelClaim: missing Channel')
  })

  it(`throws w/ invalid Channel`, function () {
    channel.Channel = 100

    assertInvalid(channel, 'PaymentChannelClaim: Channel must be a string')
  })

  it(`throws w/ invalid Balance`, function () {
    channel.Balance = 100

    assertInvalid(channel, 'PaymentChannelClaim: Balance must be a string')
  })

  it(`throws w/ invalid Amount`, function () {
    channel.Amount = 1000

    assertInvalid(channel, 'PaymentChannelClaim: Amount must be a string')
  })

  it(`throws w/ invalid Signature`, function () {
    channel.Signature = 1000

    assertInvalid(channel, 'PaymentChannelClaim: Signature must be a string')
  })

  it(`throws w/ invalid PublicKey`, function () {
    channel.PublicKey = ['100000']

    assertInvalid(channel, 'PaymentChannelClaim: PublicKey must be a string')
  })
})
