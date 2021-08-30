import { verifyPaymentChannelClaim } from "../../src";
import requests from "../fixtures/requests";
import responses from "../fixtures/responses";
import { assertResultMatch } from "../testUtils";

describe("Verify Payment Channel Claim", function () {
  it("basic verification works", function () {
    const publicKey =
      "02F89EAEC7667B30F33D0687BBA86C3FE2A08CCA40A9186C5BDE2DAA6FA97A37D8";
    const result = verifyPaymentChannelClaim(
      requests.signPaymentChannelClaim.channel,
      requests.signPaymentChannelClaim.amount,
      responses.signPaymentChannelClaim,
      publicKey
    );
    assertResultMatch(result, true, "verifyPaymentChannelClaim");
  });

  it("invalid payment channel claim fails", function () {
    const publicKey =
      "03A6523FE4281DA48A6FD77FAF3CB77F5C7001ABA0B32BCEDE0369AC009758D7D9";
    const result = verifyPaymentChannelClaim(
      requests.signPaymentChannelClaim.channel,
      requests.signPaymentChannelClaim.amount,
      responses.signPaymentChannelClaim,
      publicKey
    );
    assertResultMatch(result, false, "verifyPaymentChannelClaim");
  });
});
