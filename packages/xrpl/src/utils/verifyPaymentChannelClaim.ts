import { encodeForSigningClaim } from 'ripple-binary-codec'
import { verify } from 'ripple-keypairs'

import { xrpToDrops } from './xrpConversion'

/**
 * Verify the signature of a payment channel claim.
 *
 * @param channel - Channel identifier specified by the paymentChannelClaim.
 * @param amount - Amount specified by the paymentChannelClaim.
 * @param signature - Signature produced from signing paymentChannelClaim.
 * @param publicKey - Public key that signed the paymentChannelClaim.
 * @returns True if the channel is valid.
 * @category Utilities
 */
// eslint-disable-next-line max-params -- Needs 4 params
function verifyPaymentChannelClaim(
  channel: string,
  amount: string,
  signature: string,
  publicKey: string,
): boolean {
  const signingData = encodeForSigningClaim({
    channel,
    amount: xrpToDrops(amount),
  })
  return verify(signingData, signature, publicKey)
}

export default verifyPaymentChannelClaim
