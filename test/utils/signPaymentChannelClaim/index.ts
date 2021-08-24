import {assertResultMatch} from '../../utils'
import {channel, amount} from '../../fixtures/requests/sign-payment-channel-claim.json'
import responses from '../../fixtures/responses'
import signPaymentChannelClaim from '../../../src/utils/signPaymentChannelClaim'

describe('signPaymentChannelClaim', function () {
  it('basic signature matches', () => {
    const privateKey =
      'ACCD3309DB14D1A4FC9B1DAE608031F4408C85C73EE05E035B7DC8B25840107A'
    const result = signPaymentChannelClaim(
      channel,
      amount,
      privateKey
    )
    assertResultMatch(
      result,
      responses.signPaymentChannelClaim,
      'signPaymentChannelClaim'
    )
  })
})
