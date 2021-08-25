import requests from "../fixtures/requests";
import responses from "../fixtures/responses";
import rippled from "../fixtures/rippled";
import setupClient from "../setupClient";
import { assertResultMatch, addressTests } from "../testUtils";

const instructionsWithMaxLedgerVersionOffset = { maxLedgerVersionOffset: 100 };

/**
 * Every test suite exports their tests in the default object.
 * - Check out the "TestSuite" type for documentation on the interface.
 * - Check out "test/client/index.ts" for more information about the test runner.
 */
describe("prepareCheckCreate", () => {
  beforeEach(setupClient.setup);
  afterEach(setupClient.teardown);

  addressTests.forEach(function (test) {
    describe(test.type, () => {
      it("prepareCheckCreate", async function () {
        this.mockRippled.addResponse("server_info", rippled.server_info.normal);
        this.mockRippled.addResponse("fee", rippled.fee);
        this.mockRippled.addResponse("ledger_current", rippled.ledger_current);
        this.mockRippled.addResponse(
          "account_info",
          rippled.account_info.normal
        );
        const localInstructions = {
          ...instructionsWithMaxLedgerVersionOffset,
          maxFee: "0.000012",
        };
        const result = await this.client.prepareCheckCreate(
          test.address,
          requests.prepareCheckCreate.normal,
          localInstructions
        );
        assertResultMatch(
          result,
          responses.prepareCheckCreate.normal,
          "prepare"
        );
      });

      it("prepareCheckCreate full", async function () {
        this.mockRippled.addResponse("server_info", rippled.server_info.normal);
        this.mockRippled.addResponse("fee", rippled.fee);
        this.mockRippled.addResponse("ledger_current", rippled.ledger_current);
        this.mockRippled.addResponse(
          "account_info",
          rippled.account_info.normal
        );
        const result = await this.client.prepareCheckCreate(
          test.address,
          requests.prepareCheckCreate.full
        );
        assertResultMatch(result, responses.prepareCheckCreate.full, "prepare");
      });

      it("prepareCheckCreate with ticket", async function () {
        this.mockRippled.addResponse("server_info", rippled.server_info.normal);
        this.mockRippled.addResponse("fee", rippled.fee);
        this.mockRippled.addResponse("ledger_current", rippled.ledger_current);
        this.mockRippled.addResponse(
          "account_info",
          rippled.account_info.normal
        );
        const localInstructions = {
          ...instructionsWithMaxLedgerVersionOffset,
          maxFee: "0.000012",
          ticketSequence: 23,
        };
        const result = await this.client.prepareCheckCreate(
          test.address,
          requests.prepareCheckCreate.normal,
          localInstructions
        );
        assertResultMatch(
          result,
          responses.prepareCheckCreate.ticket,
          "prepare"
        );
      });
    });
  });
});
