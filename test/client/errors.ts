import { assert } from "chai";

import setupClient from "../setupClient";

/**
 * Every test suite exports their tests in the default object.
 * - Check out the "TestSuite" type for documentation on the interface.
 * - Check out "test/client/index.ts" for more information about the test runner.
 */
describe("errors", () => {
  beforeEach(setupClient.setup);
  afterEach(setupClient.teardown);

  it("RippleError with data", async function () {
    const error = new this.client.errors.RippleError("_message_", "_data_");
    assert.strictEqual(error.toString(), "[RippleError(_message_, '_data_')]");
  });

  it("NotFoundError default message", async function () {
    const error = new this.client.errors.NotFoundError();
    assert.strictEqual(error.toString(), "[NotFoundError(Not found)]");
  });
});
