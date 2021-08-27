import requests from "../fixtures/requests";
import responses from "../fixtures/responses";
import rippled from "../fixtures/rippled";
import { TestSuite, assertRejects, assertResultMatch } from "../testUtils";

const instructionsWithMaxLedgerVersionOffset = { maxLedgerVersionOffset: 100 };

/**
 * Every test suite exports their tests in the default object.
 * - Check out the "TestSuite" type for documentation on the interface.
 * - Check out "test/client/index.ts" for more information about the test runner.
 */
export default <TestSuite>{
  async prepareEscrowExecution(client, address, mockRippled) {
    mockRippled.addResponse("server_info", rippled.server_info.normal);
    mockRippled.addResponse("fee", rippled.fee);
    mockRippled.addResponse("ledger_current", rippled.ledger_current);
    mockRippled.addResponse("account_info", rippled.account_info.normal);
    const result = await client.prepareEscrowExecution(
      address,
      requests.prepareEscrowExecution.normal,
      instructionsWithMaxLedgerVersionOffset
    );
    assertResultMatch(
      result,
      responses.prepareEscrowExecution.normal,
      "prepare"
    );
  },

  "prepareEscrowExecution - simple": async (client, address, mockRippled) => {
    mockRippled.addResponse("server_info", rippled.server_info.normal);
    mockRippled.addResponse("fee", rippled.fee);
    mockRippled.addResponse("ledger_current", rippled.ledger_current);
    mockRippled.addResponse("account_info", rippled.account_info.normal);
    const result = await client.prepareEscrowExecution(
      address,
      requests.prepareEscrowExecution.simple
    );
    assertResultMatch(
      result,
      responses.prepareEscrowExecution.simple,
      "prepare"
    );
  },

  "prepareEscrowExecution - no condition": async (
    client,
    address,
    mockRippled
  ) => {
    mockRippled.addResponse("server_info", rippled.server_info.normal);
    mockRippled.addResponse("fee", rippled.fee);
    mockRippled.addResponse("ledger_current", rippled.ledger_current);
    mockRippled.addResponse("account_info", rippled.account_info.normal);
    await assertRejects(
      client.prepareEscrowExecution(
        address,
        requests.prepareEscrowExecution.noCondition,
        instructionsWithMaxLedgerVersionOffset
      ),
      client.errors.ValidationError,
      '"condition" and "fulfillment" fields on EscrowFinish must only be specified together.'
    );
  },

  "prepareEscrowExecution - no fulfillment": async (
    client,
    address,
    mockRippled
  ) => {
    mockRippled.addResponse("server_info", rippled.server_info.normal);
    mockRippled.addResponse("fee", rippled.fee);
    mockRippled.addResponse("ledger_current", rippled.ledger_current);
    mockRippled.addResponse("account_info", rippled.account_info.normal);
    await assertRejects(
      client.prepareEscrowExecution(
        address,
        requests.prepareEscrowExecution.noFulfillment,
        instructionsWithMaxLedgerVersionOffset
      ),
      client.errors.ValidationError,
      '"condition" and "fulfillment" fields on EscrowFinish must only be specified together.'
    );
  },

  "with ticket": async (client, address, mockRippled) => {
    mockRippled.addResponse("server_info", rippled.server_info.normal);
    mockRippled.addResponse("fee", rippled.fee);
    mockRippled.addResponse("ledger_current", rippled.ledger_current);
    mockRippled.addResponse("account_info", rippled.account_info.normal);
    const localInstructions = {
      ...instructionsWithMaxLedgerVersionOffset,
      maxFee: "0.000396",
      ticketSequence: 23,
    };
    const result = await client.prepareEscrowExecution(
      address,
      requests.prepareEscrowExecution.normal,
      localInstructions
    );
    assertResultMatch(
      result,
      responses.prepareEscrowExecution.ticket,
      "prepare"
    );
  },
};
