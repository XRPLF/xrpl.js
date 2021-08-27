import { assert } from "chai";

import { Client } from "xrpl-local";

import { TestSuite } from "../testUtils";

/**
 * Every test suite exports their tests in the default object.
 * - Check out the "TestSuite" type for documentation on the interface.
 * - Check out "test/client/index.ts" for more information about the test runner.
 */
export default <TestSuite>{
  "Client - implicit server port": () => {
    new Client("wss://s1.ripple.com");
  },

  "Client invalid options": () => {
    // @ts-expect-error - This is intentionally invalid
    assert.throws(() => new Client({ invalid: true }));
  },

  "Client valid options": () => {
    const client = new Client("wss://s:1");
    const privateConnectionUrl = (client.connection as any)._url;
    assert.deepEqual(privateConnectionUrl, "wss://s:1");
  },

  "Client invalid server uri": () => {
    assert.throws(() => new Client("wss//s:1"));
  },
};
