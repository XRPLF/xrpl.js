import { assert } from "chai";

import { isFlagEnabled } from "../../src/models/utils";

/**
 * Utils Testing.
 *
 * Provides tests for utils used in models.
 */
describe("Models Utils", function () {
  describe("isFlagEnabled", function () {
    let flags: number;
    const flag1 = 0x00010000;
    const flag2 = 0x00020000;

    beforeEach(function () {
      flags = 0x00000000;
    });

    it("verifies a flag is enabled", function () {
      flags += flag1 + flag2;
      assert.isTrue(isFlagEnabled(flags, flag1));
    });

    it("verifies a flag is not enabled", function () {
      flags += flag2;
      assert.isFalse(isFlagEnabled(flags, flag1));
    });
  });
});
