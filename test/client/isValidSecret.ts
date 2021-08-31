import { assert } from "chai";

import setupClient from "../setupClient";

describe("isValidSecret", function () {
  beforeEach(setupClient.setup);
  afterEach(setupClient.teardown);

  it("returns true for valid secret", async function () {
    assert(this.client.isValidSecret("snsakdSrZSLkYpCXxfRkS4Sh96PMK"));
  });

  it("returns false for invalid secret", async function () {
    assert(!this.client.isValidSecret("foobar"));
  });
});
