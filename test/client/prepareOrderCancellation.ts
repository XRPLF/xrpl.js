import requests from "../fixtures/requests";
import responses from "../fixtures/responses";
import rippled from "../fixtures/rippled";
import setupClient from "../setupClient";
import { assertResultMatch, addressTests } from "../testUtils";

const instructionsWithMaxLedgerVersionOffset = { maxLedgerVersionOffset: 100 };

describe("client.prepareOrderCancellation", function () {
  beforeEach(setupClient.setup);
  afterEach(setupClient.teardown);

  addressTests.forEach(function (test) {
    describe(test.type, function () {
      it("prepareOrderCancellation", async function () {
        this.mockRippled.addResponse("server_info", rippled.server_info.normal);
        this.mockRippled.addResponse("fee", rippled.fee);
        this.mockRippled.addResponse("ledger_current", rippled.ledger_current);
        this.mockRippled.addResponse(
          "account_info",
          rippled.account_info.normal
        );
        const request = requests.prepareOrderCancellation.simple;
        const result = await this.client.prepareOrderCancellation(
          test.address,
          request,
          instructionsWithMaxLedgerVersionOffset
        );
        assertResultMatch(
          result,
          responses.prepareOrderCancellation.normal,
          "prepare"
        );
      });

      it("no instructions", async function () {
        this.mockRippled.addResponse("server_info", rippled.server_info.normal);
        this.mockRippled.addResponse("fee", rippled.fee);
        this.mockRippled.addResponse("ledger_current", rippled.ledger_current);
        this.mockRippled.addResponse(
          "account_info",
          rippled.account_info.normal
        );
        const request = requests.prepareOrderCancellation.simple;
        const result = await this.client.prepareOrderCancellation(
          test.address,
          request
        );
        assertResultMatch(
          result,
          responses.prepareOrderCancellation.noInstructions,
          "prepare"
        );
      });

      it("with memos", async function () {
        this.mockRippled.addResponse("server_info", rippled.server_info.normal);
        this.mockRippled.addResponse("fee", rippled.fee);
        this.mockRippled.addResponse("ledger_current", rippled.ledger_current);
        this.mockRippled.addResponse(
          "account_info",
          rippled.account_info.normal
        );
        const request = requests.prepareOrderCancellation.withMemos;
        const result = await this.client.prepareOrderCancellation(
          test.address,
          request
        );
        assertResultMatch(
          result,
          responses.prepareOrderCancellation.withMemos,
          "prepare"
        );
      });

      // it("invalid", async function () {
      //   this.mockRippled.addResponse("server_info", rippled.server_info.normal);
      //   this.mockRippled.addResponse("fee", rippled.fee);
      //   this.mockRippled.addResponse("ledger_current", rippled.ledger_current);
      //   this.mockRippled.addResponse(
      //     "account_info",
      //     rippled.account_info.normal
      //   );
      //   const request = {
      //     ...requests.prepareOrderCancellation.withMemos,
      //   };
      //   delete request.orderSequence; // Make invalid

      //   await assertRejects(
      //     this.client.prepareOrderCancellation(test.address, request),
      //     this.client.errors.ValidationError,
      //     'instance.orderCancellation requires property "orderSequence"'
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
        const request = requests.prepareOrderCancellation.simple;
        const localInstructions = {
          ...instructionsWithMaxLedgerVersionOffset,
          maxFee: "0.000012",
          ticketSequence: 23,
        };
        const result = await this.client.prepareOrderCancellation(
          test.address,
          request,
          localInstructions
        );
        assertResultMatch(
          result,
          responses.prepareOrderCancellation.ticket,
          "prepare"
        );
      });
    });
  });
});
