import responses from "../fixtures/responses";
import rippled from "../fixtures/rippled";
import setupClient from "../setupClient";
import { addressTests, assertResultMatch } from "../testUtils";

describe("client.request", function () {
  beforeEach(setupClient.setup);
  afterEach(setupClient.teardown);

  addressTests.forEach(function (test) {
    describe(test.type, function () {
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
