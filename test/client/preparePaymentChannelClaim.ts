import assert from "assert-diff";

import requests from "../fixtures/requests";
import responses from "../fixtures/responses";
import rippled from "../fixtures/rippled";
import { assertResultMatch, TestSuite } from "../testUtils";

const instructionsWithMaxLedgerVersionOffset = { maxLedgerVersionOffset: 100 };
const { preparePaymentChannelClaim: REQUEST_FIXTURES } = requests;
const { preparePaymentChannelClaim: RESPONSE_FIXTURES } = responses;

/**
 * Every test suite exports their tests in the default object.
 * - Check out the "TestSuite" type for documentation on the interface.
 * - Check out "test/client/index.ts" for more information about the test runner.
 */
export default <TestSuite>{
  async default(client, address, mockRippled) {
    mockRippled.addResponse(
      { command: "server_info" },
      rippled.server_info.normal
    );
    mockRippled.addResponse({ command: "fee" }, rippled.fee);
    mockRippled.addResponse(
      { command: "ledger_current" },
      rippled.ledger_current
    );
    mockRippled.addResponse(
      { command: "account_info" },
      rippled.account_info.normal
    );
    const localInstructions = {
      ...instructionsWithMaxLedgerVersionOffset,
      maxFee: "0.000012",
    };
    const response = await client.preparePaymentChannelClaim(
      address,
      REQUEST_FIXTURES.normal,
      localInstructions
    );
    assertResultMatch(response, RESPONSE_FIXTURES.normal, "prepare");
  },

  "with renew": async (client, address, mockRippled) => {
    mockRippled.addResponse(
      { command: "server_info" },
      rippled.server_info.normal
    );
    mockRippled.addResponse({ command: "fee" }, rippled.fee);
    mockRippled.addResponse(
      { command: "ledger_current" },
      rippled.ledger_current
    );
    mockRippled.addResponse(
      { command: "account_info" },
      rippled.account_info.normal
    );
    const localInstructions = {
      ...instructionsWithMaxLedgerVersionOffset,
      maxFee: "0.000012",
    };
    const response = await client.preparePaymentChannelClaim(
      address,
      REQUEST_FIXTURES.renew,
      localInstructions
    );
    assertResultMatch(response, RESPONSE_FIXTURES.renew, "prepare");
  },

  "with close": async (client, address, mockRippled) => {
    mockRippled.addResponse(
      { command: "server_info" },
      rippled.server_info.normal
    );
    mockRippled.addResponse({ command: "fee" }, rippled.fee);
    mockRippled.addResponse(
      { command: "ledger_current" },
      rippled.ledger_current
    );
    mockRippled.addResponse(
      { command: "account_info" },
      rippled.account_info.normal
    );
    const localInstructions = {
      ...instructionsWithMaxLedgerVersionOffset,
      maxFee: "0.000012",
    };
    const response = await client.preparePaymentChannelClaim(
      address,
      REQUEST_FIXTURES.close,
      localInstructions
    );
    assertResultMatch(response, RESPONSE_FIXTURES.close, "prepare");
  },

  "with ticket": async (client, address, mockRippled) => {
    mockRippled.addResponse(
      { command: "server_info" },
      rippled.server_info.normal
    );
    mockRippled.addResponse({ command: "fee" }, rippled.fee);
    mockRippled.addResponse(
      { command: "ledger_current" },
      rippled.ledger_current
    );
    mockRippled.addResponse(
      { command: "account_info" },
      rippled.account_info.normal
    );
    const localInstructions = {
      ...instructionsWithMaxLedgerVersionOffset,
      maxFee: "0.000012",
      ticketSequence: 23,
    };
    const response = await client.preparePaymentChannelClaim(
      address,
      REQUEST_FIXTURES.normal,
      localInstructions
    );
    assertResultMatch(response, RESPONSE_FIXTURES.ticket, "prepare");
  },

  "rejects Promise on preparePaymentChannelClaim with renew and close": async (
    client,
    address,
    mockRippled
  ) => {
    mockRippled.addResponse(
      { command: "server_info" },
      rippled.server_info.normal
    );
    mockRippled.addResponse({ command: "fee" }, rippled.fee);
    mockRippled.addResponse(
      { command: "ledger_current" },
      rippled.ledger_current
    );
    mockRippled.addResponse(
      { command: "account_info" },
      rippled.account_info.normal
    );
    try {
      const prepared = await client.preparePaymentChannelClaim(
        address,
        REQUEST_FIXTURES.full
      );
      throw new Error(
        `Expected method to reject. Prepared transaction: ${JSON.stringify(
          prepared
        )}`
      );
    } catch (err) {
      assert.strictEqual(err.name, "ValidationError");
      assert.strictEqual(
        err.message,
        '"renew" and "close" flags on PaymentChannelClaim are mutually exclusive'
      );
    }
  },

  "rejects Promise on preparePaymentChannelClaim with no signature": async (
    client,
    address,
    mockRippled
  ) => {
    mockRippled.addResponse(
      { command: "server_info" },
      rippled.server_info.normal
    );
    mockRippled.addResponse({ command: "fee" }, rippled.fee);
    mockRippled.addResponse(
      { command: "ledger_current" },
      rippled.ledger_current
    );
    mockRippled.addResponse(
      { command: "account_info" },
      rippled.account_info.normal
    );
    try {
      const prepared = await client.preparePaymentChannelClaim(
        address,
        REQUEST_FIXTURES.noSignature
      );
      throw new Error(
        `Expected method to reject. Prepared transaction: ${JSON.stringify(
          prepared
        )}`
      );
    } catch (err) {
      assert.strictEqual(err.name, "ValidationError");
      assert.strictEqual(
        err.message,
        '"signature" and "publicKey" fields on PaymentChannelClaim must only be specified together.'
      );
    }
  },
};
