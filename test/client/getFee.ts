import { assert } from "chai";

import rippled from "../fixtures/rippled";
import { TestSuite } from "../testUtils";

/**
 * Every test suite exports their tests in the default object.
 * - Check out the "TestSuite" type for documentation on the interface.
 * - Check out "test/client/index.ts" for more information about the test runner.
 */
export default <TestSuite>{
  async getFee(client, address, mockRippled) {
    mockRippled.addResponse("server_info", rippled.server_info.normal);
    const fee = await client.getFee();
    assert.strictEqual(fee, "0.000012");
  },

  "getFee default": async (client, address, mockRippled) => {
    mockRippled.addResponse("server_info", rippled.server_info.normal);
    client._feeCushion = undefined as unknown as number;
    const fee = await client.getFee();
    assert.strictEqual(fee, "0.000012");
  },

  "getFee - high load_factor": async (client, address, mockRippled) => {
    mockRippled.addResponse("server_info", rippled.server_info.highLoadFactor);
    const fee = await client.getFee();
    assert.strictEqual(fee, "2");
  },

  "getFee - high load_factor with custom maxFeeXRP": async (
    client,
    address,
    mockRippled
  ) => {
    mockRippled.addResponse("server_info", rippled.server_info.highLoadFactor);
    // Ensure that overriding with high maxFeeXRP of '51540' causes no errors.
    // (fee will actually be 51539.607552)
    client._maxFeeXRP = "51540";
    const fee = await client.getFee();
    assert.strictEqual(fee, "51539.607552");
  },

  "getFee custom cushion": async (client, address, mockRippled) => {
    mockRippled.addResponse("server_info", rippled.server_info.normal);
    client._feeCushion = 1.4;
    const fee = await client.getFee();
    assert.strictEqual(fee, "0.000014");
  },

  // This is not recommended since it may result in attempting to pay
  // less than the base fee. However, this test verifies the existing behavior.
  "getFee cushion less than 1.0": async (client, address, mockRippled) => {
    mockRippled.addResponse("server_info", rippled.server_info.normal);
    client._feeCushion = 0.9;
    const fee = await client.getFee();
    assert.strictEqual(fee, "0.000009");
  },

  "getFee reporting": async (client, address, mockRippled) => {
    mockRippled.addResponse("server_info", rippled.server_info.normal);
    const fee = await client.getFee();
    assert.strictEqual(fee, "0.000012");
  },
};
