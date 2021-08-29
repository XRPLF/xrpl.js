import requests from "../fixtures/requests";
import responses from "../fixtures/responses";
import rippled from "../fixtures/rippled";
import { assertResultMatch, TestSuite } from "../testUtils";

const instructionsWithMaxLedgerVersionOffset = { maxLedgerVersionOffset: 100 };

/**
 * Every test suite exports their tests in the default object.
 * - Check out the "TestSuite" type for documentation on the interface.
 * - Check out "test/client/index.ts" for more information about the test runner.
 */
export default <TestSuite>{
  async prepareCheckCreate(client, address, mockRippled) {
    mockRippled.addResponse("server_info", rippled.server_info.normal);
    mockRippled.addResponse("fee", rippled.fee);
    mockRippled.addResponse("ledger_current", rippled.ledger_current);
    mockRippled.addResponse("account_info", rippled.account_info.normal);
    const localInstructions = {
      ...instructionsWithMaxLedgerVersionOffset,
      maxFee: "0.000012",
    };
    const result = await client.prepareCheckCreate(
      address,
      requests.prepareCheckCreate.normal,
      localInstructions
    );
    assertResultMatch(result, responses.prepareCheckCreate.normal, "prepare");
  },

  "prepareCheckCreate full": async (client, address, mockRippled) => {
    mockRippled.addResponse("server_info", rippled.server_info.normal);
    mockRippled.addResponse("fee", rippled.fee);
    mockRippled.addResponse("ledger_current", rippled.ledger_current);
    mockRippled.addResponse("account_info", rippled.account_info.normal);
    const result = await client.prepareCheckCreate(
      address,
      requests.prepareCheckCreate.full
    );
    assertResultMatch(result, responses.prepareCheckCreate.full, "prepare");
  },

  "prepareCheckCreate with ticket": async (client, address, mockRippled) => {
    mockRippled.addResponse("server_info", rippled.server_info.normal);
    mockRippled.addResponse("fee", rippled.fee);
    mockRippled.addResponse("ledger_current", rippled.ledger_current);
    mockRippled.addResponse("account_info", rippled.account_info.normal);
    const localInstructions = {
      ...instructionsWithMaxLedgerVersionOffset,
      maxFee: "0.000012",
      ticketSequence: 23,
    };
    const result = await client.prepareCheckCreate(
      address,
      requests.prepareCheckCreate.normal,
      localInstructions
    );
    assertResultMatch(result, responses.prepareCheckCreate.ticket, "prepare");
  },
};
