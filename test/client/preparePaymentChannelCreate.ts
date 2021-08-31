import addresses from "../fixtures/addresses.json";
import requests from "../fixtures/requests";
import responses from "../fixtures/responses";
import rippled from "../fixtures/rippled";
import setupClient from "../setupClient";
import { assertResultMatch } from "../testUtils";

const instructionsWithMaxLedgerVersionOffset = { maxLedgerVersionOffset: 100 };

export const config = {
  // TODO: The mock server right now returns a hard-coded string, no matter
  // what "Account" value you pass. We'll need it to support more accurate
  // responses before we can turn these tests on.
  skipXAddress: true,
};

describe("client.preparePaymentChannelCreate", function () {
  beforeEach(setupClient.setup);
  afterEach(setupClient.teardown);

  it("preparePaymentChannelCreate", async function () {
    this.mockRippled.addResponse("server_info", rippled.server_info.normal);
    this.mockRippled.addResponse("fee", rippled.fee);
    this.mockRippled.addResponse("ledger_current", rippled.ledger_current);
    this.mockRippled.addResponse("account_info", rippled.account_info.normal);
    const localInstructions = {
      ...instructionsWithMaxLedgerVersionOffset,
      maxFee: "0.000012",
    };
    const result = await this.client.preparePaymentChannelCreate(
      addresses.ACCOUNT,
      requests.preparePaymentChannelCreate.normal,
      localInstructions
    );
    assertResultMatch(
      result,
      responses.preparePaymentChannelCreate.normal,
      "prepare"
    );
  });

  it("preparePaymentChannelCreate full", async function () {
    this.mockRippled.addResponse("server_info", rippled.server_info.normal);
    this.mockRippled.addResponse("fee", rippled.fee);
    this.mockRippled.addResponse("ledger_current", rippled.ledger_current);
    this.mockRippled.addResponse("account_info", rippled.account_info.normal);
    const result = await this.client.preparePaymentChannelCreate(
      addresses.ACCOUNT,
      requests.preparePaymentChannelCreate.full
    );
    assertResultMatch(
      result,
      responses.preparePaymentChannelCreate.full,
      "prepare"
    );
  });

  it("preparePaymentChannelCreate with ticket", async function () {
    this.mockRippled.addResponse("server_info", rippled.server_info.normal);
    this.mockRippled.addResponse("fee", rippled.fee);
    this.mockRippled.addResponse("ledger_current", rippled.ledger_current);
    this.mockRippled.addResponse("account_info", rippled.account_info.normal);
    const localInstructions = {
      ...instructionsWithMaxLedgerVersionOffset,
      maxFee: "0.000012",
      ticketSequence: 23,
    };
    const result = await this.client.preparePaymentChannelCreate(
      addresses.ACCOUNT,
      requests.preparePaymentChannelCreate.normal,
      localInstructions
    );
    assertResultMatch(
      result,
      responses.preparePaymentChannelCreate.ticket,
      "prepare"
    );
  });
});
