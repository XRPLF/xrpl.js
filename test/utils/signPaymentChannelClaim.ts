import signPaymentChannelClaim from 'xrpl-local/utils/signPaymentChannelClaim'

import responses from '../fixtures/responses'
import { assertResultMatch } from '../testUtils'

describe('signPaymentChannelClaim', function () {
  it('basic signature matches', function () {
    const channel =
      '3E18C05AD40319B809520F1A136370C4075321B285217323396D6FD9EE1E9037'
    const amount = '.00001'
    const privateKey =
      'ACCD3309DB14D1A4FC9B1DAE608031F4408C85C73EE05E035B7DC8B25840107A'

    const result = signPaymentChannelClaim(channel, amount, privateKey)

    assertResultMatch(
      result,
      responses.signPaymentChannelClaim,
      'signPaymentChannelClaim',
    )
  })
})
