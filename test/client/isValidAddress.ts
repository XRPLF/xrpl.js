import { assert } from "chai";

import addresses from "../fixtures/addresses.json";
import setupClient from "../setupClient";

describe("isValidAddress", function () {
  beforeEach(setupClient.setup);
  afterEach(setupClient.teardown);

  it("returns true for valid address", async function () {
    assert(this.client.isValidAddress("rLczgQHxPhWtjkaQqn3Q6UM8AbRbbRvs5K"));
    assert(this.client.isValidAddress(addresses.ACCOUNT_X));
    assert(this.client.isValidAddress(addresses.ACCOUNT_T));
  });

  it("returns false for invalid address", async function () {
    assert(!this.client.isValidAddress("foobar"));
    assert(!this.client.isValidAddress(addresses.ACCOUNT_X.slice(0, -1)));
    assert(!this.client.isValidAddress(addresses.ACCOUNT_T.slice(1)));
  });
});
