import { assert } from "chai";

import { ValidationError } from "xrpl-local/common/errors";

import { verifyTrustSet } from "../../src/models/transactions/trustSet";

/**
 * TrustSet Transaction Verification Testing.
 *
 * Providing runtime verification testing for each specific transaction type.
 */
describe("TrustSet Transaction Verification", function () {
  let trustSet;

  beforeEach(function () {
    trustSet = {
      TransactionType: "TrustSet",
      Account: "rUn84CUYbNjRoTQ6mSW7BVJPSVJNLb1QLo",
      LimitAmount: {
        currency: "XRP",
        issuer: "rcXY84C4g14iFp6taFXjjQGVeHqSCh9RX",
        value: "4329.23",
      },
      QualityIn: 1234,
      QualityOut: 4321,
    } as any;
  });

  it("verifies valid TrustSet", function () {
    assert.doesNotThrow(() => verifyTrustSet(trustSet));
  });

  it("throws when LimitAmount is missing", function () {
    delete trustSet.LimitAmount;
    assert.throws(
      () => verifyTrustSet(trustSet),
      ValidationError,
      "TrustSet: missing field LimitAmount"
    );
  });

  it("throws when LimitAmount is invalid", function () {
    trustSet.LimitAmount = 1234;
    assert.throws(
      () => verifyTrustSet(trustSet),
      ValidationError,
      "TrustSet: invalid LimitAmount"
    );
  });

  it("throws when QualityIn is not a number", function () {
    trustSet.QualityIn = "1234";
    assert.throws(
      () => verifyTrustSet(trustSet),
      ValidationError,
      "TrustSet: QualityIn must be a number"
    );
  });

  it("throws when QualityOut is not a number", function () {
    trustSet.QualityOut = "4321";
    assert.throws(
      () => verifyTrustSet(trustSet),
      ValidationError,
      "TrustSet: QualityOut must be a number"
    );
  });
});
