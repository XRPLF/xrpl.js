import requests from "../fixtures/requests";
import responses from "../fixtures/responses";
import rippled from "../fixtures/rippled";
import { assertRejects, assertResultMatch, TestSuite } from "../testUtils";

const instructionsWithMaxLedgerVersionOffset = { maxLedgerVersionOffset: 100 };

export const config = {
  // TODO: The mock server right now returns a hard-coded string, no matter
  // what "Account" value you pass. We'll need it to support more accurate
  // responses before we can turn these tests on.
  skipXAddress: true,
};

/**
 * Every test suite exports their tests in the default object.
 * - Check out the "TestSuite" type for documentation on the interface.
 * - Check out "test/client/index.ts" for more information about the test runner.
 */
export default <TestSuite>{
  async prepareEscrowCreation(client, address, mockRippled) {
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
    const result = await client.prepareEscrowCreation(
      address,
      requests.prepareEscrowCreation.normal,
      localInstructions
    );
    assertResultMatch(
      result,
      responses.prepareEscrowCreation.normal,
      "prepare"
    );
  },

  "prepareEscrowCreation full": async (client, address, mockRippled) => {
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
    const result = await client.prepareEscrowCreation(
      address,
      requests.prepareEscrowCreation.full
    );
    assertResultMatch(result, responses.prepareEscrowCreation.full, "prepare");
  },

  "prepareEscrowCreation - invalid": async (client, address, mockRippled) => {
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
    const escrow = { ...requests.prepareEscrowCreation.full };
    delete escrow.amount; // Make invalid
    await assertRejects(
      client.prepareEscrowCreation(address, escrow),
      client.errors.ValidationError,
      'instance.escrowCreation requires property "amount"'
    );
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
      maxFee: "0.000396",
      ticketSequence: 23,
    };
    const result = await client.prepareEscrowCreation(
      address,
      requests.prepareEscrowCreation.normal,
      localInstructions
    );
    assertResultMatch(
      result,
      responses.prepareEscrowCreation.ticket,
      "prepare"
    );
  },
};
