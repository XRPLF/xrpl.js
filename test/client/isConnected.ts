import { assert } from "chai";

import setupClient from "../setupClient";

describe("client.isConnected", function () {
  beforeEach(setupClient.setup);
  afterEach(setupClient.teardown);

  it("disconnect & isConnected", async function () {
    assert.strictEqual(this.client.isConnected(), true);
    await this.client.disconnect();
    assert.strictEqual(this.client.isConnected(), false);
  });
});
