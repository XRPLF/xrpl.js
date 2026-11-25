import { validatePaymentChannelCreate } from '../../src/models/transactions/paymentChannelCreate'
import {
  assertTxIsValid,
  assertTxValidationError,
  generateInterfaceTypeTests,
} from '../testUtils'

const assertValid = (tx: any): void =>
  assertTxIsValid(tx, validatePaymentChannelCreate)
const assertInvalid = (tx: any, message: string): void =>
  assertTxValidationError(tx, validatePaymentChannelCreate, message)

const BASE_TX = {
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

/**
 * PaymentChannelCreate Transaction Verification Testing.
 *
 * Providing runtime verification testing for each specific transaction type.
 */
describe('PaymentChannelCreate', function () {
  let channel: any

  beforeEach(function () {
    channel = { ...BASE_TX }
  })

  describe('field type checks', function () {
    generateInterfaceTypeTests(
      {
        txType: 'PaymentChannelCreate',
        validateFn: validatePaymentChannelCreate,
        baseTx: BASE_TX,
      },
      {
        fileName: 'paymentChannelCreate.ts',
        interfaceName: 'PaymentChannelCreate',
      },
    )
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

  it(`throws w/ non-hex PublicKey`, function () {
    channel.PublicKey = 'not hex'
    assertInvalid(channel, 'PaymentChannelCreate: invalid field PublicKey')
  })
})
