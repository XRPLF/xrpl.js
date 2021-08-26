import rippled from "../fixtures/rippled";
import { assertResultMatch, TestSuite } from "../testUtils";
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

/**
 * Every test suite exports their tests in the default object.
 * - Check out the "TestSuite" type for documentation on the interface.
 * - Check out "test/client/index.ts" for more information about the test runner.
 */
export default <TestSuite>{
  "creates a ticket successfully with a sequence number": async (
    client,
    address,
    mockRippled
  ) => {
    mockRippled.addResponse("server_info", rippled.server_info.normal);
    mockRippled.addResponse("fee", rippled.fee);
    mockRippled.addResponse("ledger_current", rippled.ledger_current);
    mockRippled.addResponse("account_info", rippled.account_info.normal);
    const expected = {
      txJSON:
        '{"TransactionType":"TicketCreate", "TicketCount": 2, "Account":"r9cZA1mLK5R5Am25ArfXFmqgNwjZgnfk59","Flags":2147483648,"LastLedgerSequence":8819954,"Sequence":23,"Fee":"12"}',
      instructions: {
        maxLedgerVersion: 8819954,
        sequence: 23,
        fee: "0.000012",
      },
    };
    const response = await client.prepareTicketCreate(address, 2);
    assertResultMatch(response, expected, "prepare");
  },

  "creates a ticket successfully with another ticket": async (
    client,
    address,
    mockRippled
  ) => {
    mockRippled.addResponse("server_info", rippled.server_info.normal);
    mockRippled.addResponse("fee", rippled.fee);
    mockRippled.addResponse("ledger_current", rippled.ledger_current);
    mockRippled.addResponse("account_info", rippled.account_info.normal);
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
    const response = await client.prepareTicketCreate(address, 1, instructions);
    assertResultMatch(response, expected, "prepare");
  },
};
