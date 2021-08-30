import requests from "../fixtures/requests";
import responses from "../fixtures/responses";
import rippled from "../fixtures/rippled";
import setupClient from "../setupClient";
import { addressTests, assertRejects, assertResultMatch } from "../testUtils";

const instructionsWithMaxLedgerVersionOffset = { maxLedgerVersionOffset: 100 };

describe("client.prepareEscrowExecution", function () {
  beforeEach(setupClient.setup);
  afterEach(setupClient.teardown);

  addressTests.forEach(function (test) {
    describe(test.type, function () {
      it("prepareEscrowExecution", async function () {
        this.mockRippled.addResponse("server_info", rippled.server_info.normal);
        this.mockRippled.addResponse("fee", rippled.fee);
        this.mockRippled.addResponse("ledger_current", rippled.ledger_current);
        this.mockRippled.addResponse(
          "account_info",
          rippled.account_info.normal
        );
        const result = await this.client.prepareEscrowExecution(
          test.address,
          requests.prepareEscrowExecution.normal,
          instructionsWithMaxLedgerVersionOffset
        );
        assertResultMatch(
          result,
          responses.prepareEscrowExecution.normal,
          "prepare"
        );
      });

      it("prepareEscrowExecution - simple", async function () {
        this.mockRippled.addResponse("server_info", rippled.server_info.normal);
        this.mockRippled.addResponse("fee", rippled.fee);
        this.mockRippled.addResponse("ledger_current", rippled.ledger_current);
        this.mockRippled.addResponse(
          "account_info",
          rippled.account_info.normal
        );
        const result = await this.client.prepareEscrowExecution(
          test.address,
          requests.prepareEscrowExecution.simple
        );
        assertResultMatch(
          result,
          responses.prepareEscrowExecution.simple,
          "prepare"
        );
      });

      it("prepareEscrowExecution - no condition", async function () {
        this.mockRippled.addResponse("server_info", rippled.server_info.normal);
        this.mockRippled.addResponse("fee", rippled.fee);
        this.mockRippled.addResponse("ledger_current", rippled.ledger_current);
        this.mockRippled.addResponse(
          "account_info",
          rippled.account_info.normal
        );
        await assertRejects(
          this.client.prepareEscrowExecution(
            test.address,
            requests.prepareEscrowExecution.noCondition,
            instructionsWithMaxLedgerVersionOffset
          ),
          this.client.errors.ValidationError,
          '"condition" and "fulfillment" fields on EscrowFinish must only be specified together.'
        );
      });

      it("prepareEscrowExecution - no fulfillment", async function () {
        this.mockRippled.addResponse("server_info", rippled.server_info.normal);
        this.mockRippled.addResponse("fee", rippled.fee);
        this.mockRippled.addResponse("ledger_current", rippled.ledger_current);
        this.mockRippled.addResponse(
          "account_info",
          rippled.account_info.normal
        );
        await assertRejects(
          this.client.prepareEscrowExecution(
            test.address,
            requests.prepareEscrowExecution.noFulfillment,
            instructionsWithMaxLedgerVersionOffset
          ),
          this.client.errors.ValidationError,
          '"condition" and "fulfillment" fields on EscrowFinish must only be specified together.'
        );
      });

      it("with ticket", async function () {
        this.mockRippled.addResponse("server_info", rippled.server_info.normal);
        this.mockRippled.addResponse("fee", rippled.fee);
        this.mockRippled.addResponse("ledger_current", rippled.ledger_current);
        this.mockRippled.addResponse(
          "account_info",
          rippled.account_info.normal
        );
        const localInstructions = {
          ...instructionsWithMaxLedgerVersionOffset,
          maxFee: "0.000396",
          ticketSequence: 23,
        };
        const result = await this.client.prepareEscrowExecution(
          test.address,
          requests.prepareEscrowExecution.normal,
          localInstructions
        );
        assertResultMatch(
          result,
          responses.prepareEscrowExecution.ticket,
          "prepare"
        );
      });
    });
  });
});
