import { assert } from "chai";

import setupClient from "../setupClient";

describe("client errors", function () {
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
