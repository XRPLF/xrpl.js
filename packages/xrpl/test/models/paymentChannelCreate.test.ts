import { validatePaymentChannelCreate } from '../../src/models/transactions/paymentChannelCreate'
import { assertTxIsValid, assertTxValidationError } from '../testUtils'

const assertValid = (tx: any): void =>
  assertTxIsValid(tx, validatePaymentChannelCreate)
const assertInvalid = (tx: any, message: string): void =>
  assertTxValidationError(tx, validatePaymentChannelCreate, message)

/**
 * PaymentChannelCreate Transaction Verification Testing.
 *
 * Providing runtime verification testing for each specific transaction type.
 */
describe('PaymentChannelCreate', function () {
  let channel: any

  beforeEach(function () {
    channel = {
      Account: 'rf1BiGeXwwQoi8Z2ueFYTEXSwuJYfV2Jpn',
      TransactionType: 'PaymentChannelCreate',
      Amount: '10000',
      Destination: 'rsA2LpzuawewSBQXkiju3YQTMzW13pAAdW',
      SettleDelay: 86400,
      PublicKey:
        '32D2471DB72B27E3310F355BB33E339BF26F8392D5A93D3BC0FC3B566612DA0F0A',
      CancelAfter: 533171558,
      DestinationTag: 23480,
      SourceTag: 11747,
    }
  })

  it(`verifies valid PaymentChannelCreate`, function () {
    assertValid(channel)
  })

  it(`verifies valid PaymentChannelCreate w/o optional`, function () {
    delete channel.CancelAfter
    delete channel.DestinationTag
    delete channel.SourceTag

    assertValid(channel)
  })

  it(`missing Amount`, function () {
    delete channel.Amount

    assertInvalid(channel, 'PaymentChannelCreate: missing field Amount')
  })

  it(`missing Destination`, function () {
    delete channel.Destination

    assertInvalid(channel, 'PaymentChannelCreate: missing field Destination')
  })

  it(`missing SettleDelay`, function () {
    delete channel.SettleDelay

    assertInvalid(channel, 'PaymentChannelCreate: missing field SettleDelay')
  })

  it(`missing PublicKey`, function () {
    delete channel.PublicKey

    assertInvalid(channel, 'PaymentChannelCreate: missing field PublicKey')
  })

  it(`invalid Amount`, function () {
    channel.Amount = 1000

    assertInvalid(channel, 'PaymentChannelCreate: invalid field Amount')
  })

  it(`invalid Destination`, function () {
    channel.Destination = 10

    assertInvalid(channel, 'PaymentChannelCreate: invalid field Destination')
  })

  it(`invalid SettleDelay`, function () {
    channel.SettleDelay = 'abcd'

    assertInvalid(channel, 'PaymentChannelCreate: invalid field SettleDelay')
  })

  it(`invalid PublicKey`, function () {
    channel.PublicKey = 10

    assertInvalid(channel, 'PaymentChannelCreate: invalid field PublicKey')
  })

  it(`invalid DestinationTag`, function () {
    channel.DestinationTag = 'abcd'

    assertInvalid(channel, 'PaymentChannelCreate: invalid field DestinationTag')
  })

  it(`invalid CancelAfter`, function () {
    channel.CancelAfter = 'abcd'

    assertInvalid(channel, 'PaymentChannelCreate: invalid field CancelAfter')
  })
})
