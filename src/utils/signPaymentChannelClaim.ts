import binary from "ripple-binary-codec";
import keypairs from "ripple-keypairs";

import { validate } from "../common";

import { xrpToDrops } from ".";

function signPaymentChannelClaim(
  channel: string,
  amount: string,
  privateKey: string
): string {
  validate.signPaymentChannelClaim({ channel, amount, privateKey });
  const signingData = binary.encodeForSigningClaim({
    channel,
    amount: xrpToDrops(amount),
  });
  return keypairs.sign(signingData, privateKey);
}

export default signPaymentChannelClaim;
