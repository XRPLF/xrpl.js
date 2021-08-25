import { assert } from "chai";

import { assertRejects } from "../testUtils";
import rippled from "../fixtures/rippled";
import setupClient from "../setupClient";

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
describe("requestNextPage", () => {
  beforeEach(setupClient.setup);
  afterEach(setupClient.teardown);
  it("requests the next page", async function () {
    this.mockRippled.addResponse("ledger_data", rippledResponse);
    const response = await this.client.request({ command: "ledger_data" });
    const responseNextPage = await this.client.requestNextPage(
      { command: "ledger_data" },
      response
    );
    assert.equal(
      responseNextPage.result.state[0].index,
      "000B714B790C3C79FEE00D17C4DEB436B375466F29679447BA64F265FD63D731"
    );
  });

  it("rejects when there are no more pages", async function () {
    this.mockRippled.addResponse("ledger_data", rippledResponse);
    const response = await this.client.request({ command: "ledger_data" });
    const responseNextPage = await this.client.requestNextPage(
      { command: "ledger_data" },
      response
    );
    assert(!this.client.hasNextPage(responseNextPage));
    await assertRejects(
      this.client.requestNextPage({ command: "ledger_data" }, responseNextPage),
      Error,
      "response does not have a next page"
    );
  });
});
