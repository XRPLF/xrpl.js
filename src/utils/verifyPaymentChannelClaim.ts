import binary from 'ripple-binary-codec'
import keypairs from 'ripple-keypairs'

import { xrpToDrops } from '.'

function verifyPaymentChannelClaim(
  channel: string,
  amount: string,
  signature: string,
  publicKey: string,
): boolean {
  const signingData = binary.encodeForSigningClaim({
    channel,
    amount: xrpToDrops(amount),
  })
  return keypairs.verify(signingData, signature, publicKey)
}

export default verifyPaymentChannelClaim
