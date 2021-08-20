import {assertResultMatch} from '../../utils'
import {channel, amount} from '../../fixtures/requests/sign-payment-channel-claim.json'
import signedPaymentChannelClaim from '../../fixtures/responses/sign-payment-channel-claim.json'
import signPaymentChannelClaim from '../../../src/utils/sign-payment-channel-claim'
//import signPaymentChannelClaim from '../../../src/utils/sign-payment-channel-claim'

describe('signPaymentChannelClaim', function () {
  it('basic signature matches', () => {
    const privateKey =
      'ACCD3309DB14D1A4FC9B1DAE608031F4408C85C73EE05E035B7DC8B25840107A';
    const result = signPaymentChannelClaim(
      channel,
      amount,
      privateKey
    )
    assertResultMatch(
      result,
      signedPaymentChannelClaim,
      'signPaymentChannelClaim'
    )
  })
})
