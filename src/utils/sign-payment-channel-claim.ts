import keypairs from 'ripple-keypairs'
import binary from 'ripple-binary-codec'
import { validate } from '../common'
import { xrpToDrops } from '.'

function signPaymentChannelClaim(
  channel: string,
  amount: string,
  privateKey: string
): string {
  console.log("Entered method")
  validate.signPaymentChannelClaim({channel, amount, privateKey})
  console.log("Validated")
  const signingData = binary.encodeForSigningClaim({
    channel: channel,
    amount: xrpToDrops(amount)
  })
  return keypairs.sign(signingData, privateKey)
}

export default signPaymentChannelClaim
