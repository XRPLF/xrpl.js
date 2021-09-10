import binary from 'ripple-binary-codec'
import keypairs from 'ripple-keypairs'

import { xrpToDrops } from './xrpConversion'

/**
 * Sign a payment channel claim.
 *
 * @param channel - Channel identifier specified by the paymentChannelClaim.
 * @param amount - Amount specified by the paymentChannelClaim.
 * @param privateKey - Private Key to sign paymentChannelClaim with.
 * @returns True if the channel is valid.
 */
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
