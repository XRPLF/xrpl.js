import responses from "../fixtures/responses";
import rippled from "../fixtures/rippled";
import { addressTests, assertResultMatch } from "../testUtils";
import setupClient from "../setupClient";

/**
 * Every test suite exports their tests in the default object.
 * - Check out the "TestSuite" type for documentation on the interface.
 * - Check out "test/client/index.ts" for more information about the test runner.
 */
describe("request", () => {
  beforeEach(setupClient.setup);
  afterEach(setupClient.teardown);

  addressTests.forEach(function (test) {
    describe(test.type, () => {
      it("request account_objects", async function () {
        this.mockRippled.addResponse(
          "account_objects",
          rippled.account_objects.normal
        );
        const result = await this.client.request({
          command: "account_objects",
          account: test.address,
        });

        assertResultMatch(
          result.result,
          responses.getAccountObjects,
          "AccountObjectsResponse"
        );
      });

      it("request account_objects - invalid options", async function () {
        this.mockRippled.addResponse(
          "account_objects",
          rippled.account_objects.normal
        );
        const result = await this.client.request({
          command: "account_objects",
          account: test.address,
        });

        assertResultMatch(
          result.result,
          responses.getAccountObjects,
          "AccountObjectsResponse"
        );
      });
    });
  });
});
