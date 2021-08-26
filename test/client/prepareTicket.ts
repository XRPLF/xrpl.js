import rippled from "../fixtures/rippled";
import setupClient from "../setupClient";
import { assertResultMatch, addressTests } from "../testUtils";
// import responses from '../fixtures/responses'
// import requests from '../fixtures/requests'
// import {ValidationError} from 'xrpl-local/common/errors'
// import binary from 'ripple-binary-codec'
// import {assert} from 'chai'
// import {Client} from 'xrpl-local'
// import * as schemaValidator from 'xrpl-local/common/schema-validator'

// const instructionsWithMaxLedgerVersionOffset = {maxLedgerVersionOffset: 100}
// const {preparePayment: REQUEST_FIXTURES} = requests
// const {preparePayment: RESPONSE_FIXTURES} = responses
// const ADDRESS = 'rpZc4mVfWUif9CRoHRKKcmhu1nx2xktxBo'

describe("client.prepareTicket", function () {
  beforeEach(setupClient.setup);
  afterEach(setupClient.teardown);

  addressTests.forEach(function (test) {
    describe(test.type, function () {
      it("creates a ticket successfully with a sequence number", async function () {
        this.mockRippled.addResponse("server_info", rippled.server_info.normal);
        this.mockRippled.addResponse("fee", rippled.fee);
        this.mockRippled.addResponse("ledger_current", rippled.ledger_current);
        this.mockRippled.addResponse(
          "account_info",
          rippled.account_info.normal
        );
        const expected = {
          txJSON:
            '{"TransactionType":"TicketCreate", "TicketCount": 2, "Account":"r9cZA1mLK5R5Am25ArfXFmqgNwjZgnfk59","Flags":2147483648,"LastLedgerSequence":8819954,"Sequence":23,"Fee":"12"}',
          instructions: {
            maxLedgerVersion: 8819954,
            sequence: 23,
            fee: "0.000012",
          },
        };
        const response = await this.client.prepareTicketCreate(test.address, 2);
        assertResultMatch(response, expected, "prepare");
      });

      it("creates a ticket successfully with another ticket", async function () {
        this.mockRippled.addResponse("server_info", rippled.server_info.normal);
        this.mockRippled.addResponse("fee", rippled.fee);
        this.mockRippled.addResponse("ledger_current", rippled.ledger_current);
        this.mockRippled.addResponse(
          "account_info",
          rippled.account_info.normal
        );
        const expected = {
          txJSON:
            '{"TransactionType":"TicketCreate", "TicketCount": 1, "Account":"r9cZA1mLK5R5Am25ArfXFmqgNwjZgnfk59","Flags":2147483648,"LastLedgerSequence":8819954,"Sequence": 0,"TicketSequence":23,"Fee":"12"}',
          instructions: {
            maxLedgerVersion: 8819954,
            ticketSequence: 23,
            fee: "0.000012",
          },
        };
        const instructions = {
          maxLedgerVersion: 8819954,
          ticketSequence: 23,
          fee: "0.000012",
        };
        const response = await this.client.prepareTicketCreate(
          test.address,
          1,
          instructions
        );
        assertResultMatch(response, expected, "prepare");
      });
    });
  });
});
