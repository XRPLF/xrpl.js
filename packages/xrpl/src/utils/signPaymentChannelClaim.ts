import { encodeForSigningClaim } from 'ripple-binary-codec'
import { sign } from 'ripple-keypairs'

import { xrpToDrops } from './xrpConversion'

/**
 * Sign a payment channel claim.
 *
 * @param channel - Channel identifier specified by the paymentChannelClaim.
 * @param amount - Amount specified by the paymentChannelClaim.
 * @param privateKey - Private Key to sign paymentChannelClaim with.
 * @returns True if the channel is valid.
 * @category Utilities
 */
function signPaymentChannelClaim(
  channel: string,
  amount: string,
  privateKey: string,
): string {
  const signingData = encodeForSigningClaim({
    channel,
    amount: xrpToDrops(amount),
  })
  return sign(signingData, privateKey)
}

export default signPaymentChannelClaim
