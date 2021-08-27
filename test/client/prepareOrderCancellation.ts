import requests from "../fixtures/requests";
import responses from "../fixtures/responses";
import rippled from "../fixtures/rippled";
import { assertRejects, assertResultMatch, TestSuite } from "../testUtils";

const instructionsWithMaxLedgerVersionOffset = { maxLedgerVersionOffset: 100 };

/**
 * Every test suite exports their tests in the default object.
 * - Check out the "TestSuite" type for documentation on the interface.
 * - Check out "test/client/index.ts" for more information about the test runner.
 */
export default <TestSuite>{
  async prepareOrderCancellation(client, address, mockRippled) {
    mockRippled.addResponse("server_info", rippled.server_info.normal);
    mockRippled.addResponse("fee", rippled.fee);
    mockRippled.addResponse("ledger_current", rippled.ledger_current);
    mockRippled.addResponse("account_info", rippled.account_info.normal);
    const request = requests.prepareOrderCancellation.simple;
    const result = await client.prepareOrderCancellation(
      address,
      request,
      instructionsWithMaxLedgerVersionOffset
    );
    assertResultMatch(
      result,
      responses.prepareOrderCancellation.normal,
      "prepare"
    );
  },

  "no instructions": async (client, address, mockRippled) => {
    mockRippled.addResponse("server_info", rippled.server_info.normal);
    mockRippled.addResponse("fee", rippled.fee);
    mockRippled.addResponse("ledger_current", rippled.ledger_current);
    mockRippled.addResponse("account_info", rippled.account_info.normal);
    const request = requests.prepareOrderCancellation.simple;
    const result = await client.prepareOrderCancellation(address, request);
    assertResultMatch(
      result,
      responses.prepareOrderCancellation.noInstructions,
      "prepare"
    );
  },

  "with memos": async (client, address, mockRippled) => {
    mockRippled.addResponse("server_info", rippled.server_info.normal);
    mockRippled.addResponse("fee", rippled.fee);
    mockRippled.addResponse("ledger_current", rippled.ledger_current);
    mockRippled.addResponse("account_info", rippled.account_info.normal);
    const request = requests.prepareOrderCancellation.withMemos;
    const result = await client.prepareOrderCancellation(address, request);
    assertResultMatch(
      result,
      responses.prepareOrderCancellation.withMemos,
      "prepare"
    );
  },

  async invalid(client, address, mockRippled) {
    mockRippled.addResponse("server_info", rippled.server_info.normal);
    mockRippled.addResponse("fee", rippled.fee);
    mockRippled.addResponse("ledger_current", rippled.ledger_current);
    mockRippled.addResponse("account_info", rippled.account_info.normal);
    const request = {
      ...requests.prepareOrderCancellation.withMemos,
    };
    delete request.orderSequence; // Make invalid

    await assertRejects(
      client.prepareOrderCancellation(address, request),
      client.errors.ValidationError,
      'instance.orderCancellation requires property "orderSequence"'
    );
  },

  "with ticket": async (client, address, mockRippled) => {
    mockRippled.addResponse("server_info", rippled.server_info.normal);
    mockRippled.addResponse("fee", rippled.fee);
    mockRippled.addResponse("ledger_current", rippled.ledger_current);
    mockRippled.addResponse("account_info", rippled.account_info.normal);
    const request = requests.prepareOrderCancellation.simple;
    const localInstructions = {
      ...instructionsWithMaxLedgerVersionOffset,
      maxFee: "0.000012",
      ticketSequence: 23,
    };
    const result = await client.prepareOrderCancellation(
      address,
      request,
      localInstructions
    );
    assertResultMatch(
      result,
      responses.prepareOrderCancellation.ticket,
      "prepare"
    );
  },
};
