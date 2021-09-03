import binary from 'ripple-binary-codec'
import keypairs from 'ripple-keypairs'

import { xrpToDrops } from '.'

function signPaymentChannelClaim(
  channel: string,
  amount: string,
  privateKey: string,
): string {
  const signingData = binary.encodeForSigningClaim({
    channel,
    amount: xrpToDrops(amount),
  })
  return keypairs.sign(signingData, privateKey)
}

export default signPaymentChannelClaim
