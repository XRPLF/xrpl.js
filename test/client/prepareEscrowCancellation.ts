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
  prepareEscrowCancellation: async (client, address, mockRippled) => {
    mockRippled.addResponse("server_info", rippled.server_info.normal);
    mockRippled.addResponse("fee", rippled.fee);
    mockRippled.addResponse("ledger_current", rippled.ledger_current);
    mockRippled.addResponse("account_info", rippled.account_info.normal);
    const result = await client.prepareEscrowCancellation(
      address,
      requests.prepareEscrowCancellation.normal,
      instructionsWithMaxLedgerVersionOffset
    );
    assertResultMatch(
      result,
      responses.prepareEscrowCancellation.normal,
      "prepare"
    );
  },

  "prepareEscrowCancellation with memos": async (
    client,
    address,
    mockRippled
  ) => {
    mockRippled.addResponse("server_info", rippled.server_info.normal);
    mockRippled.addResponse("fee", rippled.fee);
    mockRippled.addResponse("ledger_current", rippled.ledger_current);
    mockRippled.addResponse("account_info", rippled.account_info.normal);
    const result = await client.prepareEscrowCancellation(
      address,
      requests.prepareEscrowCancellation.memos
    );
    assertResultMatch(
      result,
      responses.prepareEscrowCancellation.memos,
      "prepare"
    );
  },

  "with ticket": async (client, address, mockRippled) => {
    mockRippled.addResponse("server_info", rippled.server_info.normal);
    mockRippled.addResponse("fee", rippled.fee);
    mockRippled.addResponse("ledger_current", rippled.ledger_current);
    mockRippled.addResponse("account_info", rippled.account_info.normal);
    const localInstructions = {
      ...instructionsWithMaxLedgerVersionOffset,
      maxFee: "0.000012",
      ticketSequence: 23,
    };
    const result = await client.prepareEscrowCancellation(
      address,
      requests.prepareEscrowCancellation.normal,
      localInstructions
    );
    assertResultMatch(
      result,
      responses.prepareEscrowCancellation.ticket,
      "prepare"
    );
  },
};
