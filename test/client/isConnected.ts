import { assert } from "chai";

import setupClient from "../setupClient";

/**
 * Every test suite exports their tests in the default object.
 * - Check out the "TestSuite" type for documentation on the interface.
 * - Check out "test/client/index.ts" for more information about the test runner.
 */
describe("client.isConnected", () => {
  beforeEach(setupClient.setup);
  afterEach(setupClient.teardown);

  it("disconnect & isConnected", async function () {
    assert.strictEqual(this.client.isConnected(), true);
    await this.client.disconnect();
    assert.strictEqual(this.client.isConnected(), false);
  });
});
