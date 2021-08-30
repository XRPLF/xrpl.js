import addresses from "../fixtures/addresses.json";
import responses from "../fixtures/responses";
import rippled from "../fixtures/rippled/accountLines";
import { assertResultMatch, TestSuite } from "../testUtils";

const { getTrustlines: RESPONSE_FIXTURES } = responses;

/**
 * Every test suite exports their tests in the default object.
 * - Check out the "TestSuite" type for documentation on the interface.
 * - Check out "test/client/index.ts" for more information about the test runner.
 */
export default <TestSuite>{
  "getTrustlines - filtered": async (client, address, mockRippled) => {
    mockRippled.addResponse("account_lines", rippled.normal);
    const options = { currency: "USD" };
    const result = await client.getTrustlines(address, options);
    assertResultMatch(result, RESPONSE_FIXTURES.filtered, "getTrustlines");
  },

  "getTrustlines - more than 400 items": async (
    client,
    address,
    mockRippled
  ) => {
    mockRippled.addResponse("account_lines", rippled.manyItems);
    const options = { limit: 401 };
    const result = await client.getTrustlines(address, options);
    assertResultMatch(
      result,
      RESPONSE_FIXTURES.moreThan400Items,
      "getTrustlines"
    );
  },

  "getTrustlines - no options": async (client, address, mockRippled) => {
    mockRippled.addResponse("account_lines", rippled.normal);
    await client.getTrustlines(address);
  },

  "getTrustlines - ripplingDisabled works properly": async (
    client,
    address,
    mockRippled
  ) => {
    mockRippled.addResponse("account_lines", rippled.ripplingDisabled);
    const result = await client.getTrustlines(address);
    assertResultMatch(
      result,
      RESPONSE_FIXTURES.ripplingDisabled,
      "getTrustlines"
    );
  },

  "getTrustlines - ledger version option": async (
    client,
    address,
    mockRippled
  ) => {
    mockRippled.addResponse("account_lines", rippled.manyItems);
    const result = await client.getTrustlines(addresses.FOURTH_ACCOUNT, {
      ledgerVersion: 5,
    });
    assertResultMatch(
      result,
      RESPONSE_FIXTURES.moreThan400Items,
      "getTrustlines"
    );
  },
};
