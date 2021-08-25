import { assert } from "chai";

import rippled from "../fixtures/rippled";
import setupClient from "../setupClient";

/**
 * Every test suite exports their tests in the default object.
 * - Check out the "TestSuite" type for documentation on the interface.
 * - Check out "test/client/index.ts" for more information about the test runner.
 */
describe("hasNextPage", () => {
  beforeEach(setupClient.setup);
  afterEach(setupClient.teardown);
  it("returns true when there is another page", async function () {
    this.mockRippled.addResponse("ledger_data", rippled.ledger_data.first_page);
    const response = await this.client.request({ command: "ledger_data" });
    assert(this.client.hasNextPage(response));
  });

  it("returns false when there are no more pages", async function () {
    const rippledResponse = function (request: Request): object {
      if ("marker" in request) {
        return rippled.ledger_data.last_page;
      }
      return rippled.ledger_data.first_page;
    };
    this.mockRippled.addResponse("ledger_data", rippledResponse);
    const response = await this.client.request({ command: "ledger_data" });
    const responseNextPage = await this.client.requestNextPage(
      { command: "ledger_data" },
      response
    );
    assert(!this.client.hasNextPage(responseNextPage));
  });
});
