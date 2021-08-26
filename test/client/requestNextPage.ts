import assert from "assert-diff";

import rippled from "../fixtures/rippled";
import { assertRejects, TestSuite } from "../testUtils";

const rippledResponse = function (request: Request): object {
  if ("marker" in request) {
    return rippled.ledger_data.last_page;
  }
  return rippled.ledger_data.first_page;
};

/**
 * Every test suite exports their tests in the default object.
 * - Check out the "TestSuite" type for documentation on the interface.
 * - Check out "test/client/index.ts" for more information about the test runner.
 */
export default <TestSuite>{
  "requests the next page": async (client, address, mockRippled) => {
    mockRippled.addResponse({ command: "ledger_data" }, rippledResponse);
    const response = await client.request({ command: "ledger_data" });
    const responseNextPage = await client.requestNextPage(
      { command: "ledger_data" },
      response
    );
    assert.equal(
      responseNextPage.result.state[0].index,
      "000B714B790C3C79FEE00D17C4DEB436B375466F29679447BA64F265FD63D731"
    );
  },

  "rejects when there are no more pages": async (
    client,
    address,
    mockRippled
  ) => {
    mockRippled.addResponse({ command: "ledger_data" }, rippledResponse);
    const response = await client.request({ command: "ledger_data" });
    const responseNextPage = await client.requestNextPage(
      { command: "ledger_data" },
      response
    );
    assert(!client.hasNextPage(responseNextPage));
    await assertRejects(
      client.requestNextPage({ command: "ledger_data" }, responseNextPage),
      Error,
      "response does not have a next page"
    );
  },
};
