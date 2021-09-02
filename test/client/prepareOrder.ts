import requests from "../fixtures/requests";
import responses from "../fixtures/responses";
import rippled from "../fixtures/rippled";
import setupClient from "../setupClient";
import { assertResultMatch, addressTests } from "../testUtils";

const instructionsWithMaxLedgerVersionOffset = { maxLedgerVersionOffset: 100 };

describe("client.prepareOrder", function () {
  beforeEach(setupClient.setup);
  afterEach(setupClient.teardown);

  addressTests.forEach(function (test) {
    describe(test.type, function () {
      it("buy order", async function () {
        this.mockRippled.addResponse("server_info", rippled.server_info.normal);
        this.mockRippled.addResponse("fee", rippled.fee);
        this.mockRippled.addResponse("ledger_current", rippled.ledger_current);
        this.mockRippled.addResponse(
          "account_info",
          rippled.account_info.normal
        );
        const request = requests.prepareOrder.buy;
        const result = await this.client.prepareOrder(test.address, request);
        assertResultMatch(result, responses.prepareOrder.buy, "prepare");
      });

      it("buy order with expiration", async function () {
        this.mockRippled.addResponse("server_info", rippled.server_info.normal);
        this.mockRippled.addResponse("fee", rippled.fee);
        this.mockRippled.addResponse("ledger_current", rippled.ledger_current);
        this.mockRippled.addResponse(
          "account_info",
          rippled.account_info.normal
        );
        const request = requests.prepareOrder.expiration;
        const response = responses.prepareOrder.expiration;
        const result = await this.client.prepareOrder(
          test.address,
          request,
          instructionsWithMaxLedgerVersionOffset
        );
        assertResultMatch(result, response, "prepare");
      });

      it("sell order", async function () {
        this.mockRippled.addResponse("server_info", rippled.server_info.normal);
        this.mockRippled.addResponse("fee", rippled.fee);
        this.mockRippled.addResponse("ledger_current", rippled.ledger_current);
        this.mockRippled.addResponse(
          "account_info",
          rippled.account_info.normal
        );
        const request = requests.prepareOrder.sell;
        const result = await this.client.prepareOrder(
          test.address,
          request,
          instructionsWithMaxLedgerVersionOffset
        );
        assertResultMatch(result, responses.prepareOrder.sell, "prepare");
      });

      // it("invalid", async function () {
      //   this.mockRippled.addResponse("server_info", rippled.server_info.normal);
      //   this.mockRippled.addResponse("fee", rippled.fee);
      //   this.mockRippled.addResponse("ledger_current", rippled.ledger_current);
      //   this.mockRippled.addResponse(
      //     "account_info",
      //     rippled.account_info.normal
      //   );
      //   const request = { ...requests.prepareOrder.sell };
      //   delete request.direction; // Make invalid
      //   await assertRejects(
      //     this.client.prepareOrder(
      //       test.address,
      //       request,
      //       instructionsWithMaxLedgerVersionOffset
      //     ),
      //     this.client.errors.ValidationError,
      //     'instance.order requires property "direction"'
      //   );
      // });

      it("with ticket", async function () {
        this.mockRippled.addResponse("server_info", rippled.server_info.normal);
        this.mockRippled.addResponse("fee", rippled.fee);
        this.mockRippled.addResponse("ledger_current", rippled.ledger_current);
        this.mockRippled.addResponse(
          "account_info",
          rippled.account_info.normal
        );
        const request = requests.prepareOrder.sell;
        const localInstructions = {
          ...instructionsWithMaxLedgerVersionOffset,
          maxFee: "0.000012",
          ticketSequence: 23,
        };
        const result = await this.client.prepareOrder(
          test.address,
          request,
          localInstructions
        );
        assertResultMatch(result, responses.prepareOrder.ticket, "prepare");
      });
    });
  });
});
