import responses from "../fixtures/responses";
import rippled from "../fixtures/rippled";
import { TestSuite, assertResultMatch } from "../testUtils";

/**
 * Every test suite exports their tests in the default object.
 * - Check out the "TestSuite" type for documentation on the interface.
 * - Check out "test/client/index.ts" for more information about the test runner.
 */
export default <TestSuite>{
  "request account_objects": async (client, address, mockRippled) => {
    mockRippled.addResponse("account_objects", rippled.account_objects.normal);
    const result = await client.request({
      command: "account_objects",
      account: address,
    });

    assertResultMatch(
      result.result,
      responses.getAccountObjects,
      "AccountObjectsResponse"
    );
  },

  "request account_objects - invalid options": async (
    client,
    address,
    mockRippled
  ) => {
    mockRippled.addResponse("account_objects", rippled.account_objects.normal);
    const result = await client.request({
      command: "account_objects",
      account: address,
    });

    assertResultMatch(
      result.result,
      responses.getAccountObjects,
      "AccountObjectsResponse"
    );
  },
};
