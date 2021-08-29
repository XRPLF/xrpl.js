import { assert } from "chai";

import { TestSuite } from "../testUtils";

/**
 * Every test suite exports their tests in the default object.
 * - Check out the "TestSuite" type for documentation on the interface.
 * - Check out "test/client/index.ts" for more information about the test runner.
 */
export default <TestSuite>{
  "RippleError with data": async (client, address) => {
    const error = new client.errors.RippleError("_message_", "_data_");
    assert.strictEqual(error.toString(), "[RippleError(_message_, '_data_')]");
  },

  "NotFoundError default message": async (client, address) => {
    const error = new client.errors.NotFoundError();
    assert.strictEqual(error.toString(), "[NotFoundError(Not found)]");
  },
};
