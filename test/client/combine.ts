import { assert } from "chai";
import binary from "ripple-binary-codec";

import requests from "../fixtures/requests";
import responses from "../fixtures/responses";
import setupClient from "../setupClient";
import { assertResultMatch } from "../testUtils";

const { combine: REQUEST_FIXTURES } = requests;
const { combine: RESPONSE_FIXTURES } = responses;

/**
 * Every test suite exports their tests in the default object.
 * - Check out the "TestSuite" type for documentation on the interface.
 * - Check out "test/client/index.ts" for more information about the test runner.
 */
describe("combine", () => {
  beforeEach(setupClient.setup);
  afterEach(setupClient.teardown);

  it(" combine", async function () {
    const combined = this.client.combine(REQUEST_FIXTURES.setDomain);
    assertResultMatch(combined, RESPONSE_FIXTURES.single, "sign");
  });

  it("combine - different transactions", async function () {
    const request = [REQUEST_FIXTURES.setDomain[0]];
    const tx = binary.decode(REQUEST_FIXTURES.setDomain[0]);
    tx.Flags = 0;
    request.push(binary.encode(tx));
    assert.throws(() => {
      this.client.combine(request);
    }, /txJSON is not the same for all signedTransactions/);
  });
});
