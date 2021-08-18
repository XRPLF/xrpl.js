import {assertResultMatch} from '../../utils'
import requests from '../../fixtures/requests'
import responses from '../../fixtures/responses'
import {signPaymentChannelClaim} from '../../../src'

describe('signPaymentChannelClaim', function () {
  it('basic signature matches', () => {
    const privateKey =
      'ACCD3309DB14D1A4FC9B1DAE608031F4408C85C73EE05E035B7DC8B25840107A'
    const result = signPaymentChannelClaim(
      requests.signPaymentChannelClaim.channel,
      requests.signPaymentChannelClaim.amount,
      privateKey
    )
    assertResultMatch(
      result,
      responses.signPaymentChannelClaim,
      'signPaymentChannelClaim'
    )
  })
})
