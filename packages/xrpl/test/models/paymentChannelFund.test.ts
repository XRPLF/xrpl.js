import { validatePaymentChannelFund } from '../../src/models/transactions/paymentChannelFund'
import { assertTxIsValid, assertTxValidationError } from '../testUtils'

const assertValid = (tx: any): void =>
  assertTxIsValid(tx, validatePaymentChannelFund)
const assertInvalid = (tx: any, message: string): void =>
  assertTxValidationError(tx, validatePaymentChannelFund, message)

/**
 * PaymentChannelFund Transaction Verification Testing.
 *
 * Providing runtime verification testing for each specific transaction type.
 */
describe('PaymentChannelFund', function () {
  let channel: any

  beforeEach(function () {
    channel = {
      Account: 'rf1BiGeXwwQoi8Z2ueFYTEXSwuJYfV2Jpn',
      TransactionType: 'PaymentChannelFund',
      Channel:
        'C1AE6DDDEEC05CF2978C0BAD6FE302948E9533691DC749DCDD3B9E5992CA6198',
      Amount: '200000',
      Expiration: 543171558,
    }
  })

  it(`verifies valid PaymentChannelFund`, function () {
    assertValid(channel)
  })

  it(`verifies valid PaymentChannelFund w/o optional`, function () {
    delete channel.Expiration

    assertValid(channel)
  })

  it(`throws w/ missing Amount`, function () {
    delete channel.Amount

    assertInvalid(channel, 'PaymentChannelFund: missing Amount')
  })

  it(`throws w/ missing Channel`, function () {
    delete channel.Channel

    assertInvalid(channel, 'PaymentChannelFund: missing Channel')
  })

  it(`throws w/ invalid Amount`, function () {
    channel.Amount = 100

    assertInvalid(channel, 'PaymentChannelFund: Amount must be a string')
  })

  it(`throws w/ invalid Channel`, function () {
    channel.Channel = 1000

    assertInvalid(channel, 'PaymentChannelFund: Channel must be a string')
  })

  it(`throws w/ invalid Expiration`, function () {
    channel.Expiration = '1000'

    assertInvalid(channel, 'PaymentChannelFund: Expiration must be a number')
  })
})
