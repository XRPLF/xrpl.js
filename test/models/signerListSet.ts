import { assert } from "chai";

import { ValidationError } from "xrpl-local/common/errors";

import { verifySignerListSet } from "../../src/models/transactions/signerListSet";

/**
 * SignerListSet Transaction Verification Testing.
 *
 * Providing runtime verification testing for each specific transaction type.
 */
describe("SignerListSet Transaction Verification", function () {
  let SignerListSetTx;

  beforeEach(function () {
    SignerListSetTx = {
      Flags: 0,
      TransactionType: "SignerListSet",
      Account: "rf1BiGeXwwQoi8Z2ueFYTEXSwuJYfV2Jpn",
      Fee: "12",
      SignerQuorum: 3,
      SignerEntries: [
        {
          SignerEntry: {
            Account: "rsA2LpzuawewSBQXkiju3YQTMzW13pAAdW",
            SignerWeight: 2,
          },
        },
        {
          SignerEntry: {
            Account: "rUpy3eEg8rqjqfUoLeBnZkscbKbFsKXC3v",
            SignerWeight: 1,
          },
        },
        {
          SignerEntry: {
            Account: "raKEEVSGnKSD9Zyvxu4z6Pqpm4ABH8FS6n",
            SignerWeight: 1,
          },
        },
      ],
    } as any;
  });

  it(`verifies valid SignerListSet`, function () {
    assert.doesNotThrow(() => verifySignerListSet(SignerListSetTx));
  });

  it(`throws w/ missing SignerQuorum`, function () {
    SignerListSetTx.SignerQuorum = undefined;

    assert.throws(
      () => verifySignerListSet(SignerListSetTx),
      ValidationError,
      "SignerListSet: missing field SignerQuorum"
    );
  });

  it(`throws w/ empty SignerEntries`, function () {
    SignerListSetTx.SignerEntries = [];

    assert.throws(
      () => verifySignerListSet(SignerListSetTx),
      ValidationError,
      "SignerListSet: need atleast 1 member in SignerEntries"
    );
  });

  it(`throws w/ invalid SignerEntries`, function () {
    SignerListSetTx.SignerEntries = "khgfgyhujk";

    assert.throws(
      () => verifySignerListSet(SignerListSetTx),
      ValidationError,
      "SignerListSet: invalid SignerEntries"
    );
  });
});
