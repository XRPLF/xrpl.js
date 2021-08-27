import { assert } from "chai";

import { ValidationError } from "xrpl-local/common/errors";

import { verifyCheckCancel } from "../../src/models/transactions/checkCancel";

/**
 * CheckCancel Transaction Verification Testing.
 *
 * Providing runtime verification testing for each specific transaction type.
 */
describe("CheckCancel Transaction Verification", function () {
  it(`verifies valid CheckCancel`, function () {
    const validCheckCancel = {
      Account: "rUn84CUYbNjRoTQ6mSW7BVJPSVJNLb1QLo",
      TransactionType: "CheckCancel",
      CheckID:
        "49647F0D748DC3FE26BDACBC57F251AADEFFF391403EC9BF87C97F67E9977FB0",
    } as any;

    assert.doesNotThrow(() => verifyCheckCancel(validCheckCancel));
  });

  it(`throws w/ invalid CheckCancel`, function () {
    const invalidCheckID = {
      Account: "rUn84CUYbNjRoTQ6mSW7BVJPSVJNLb1QLo",
      TransactionType: "CheckCancel",
      CheckID: 496473456789876545678909876545678,
    } as any;

    assert.throws(
      () => verifyCheckCancel(invalidCheckID),
      ValidationError,
      "CheckCancel: invalid CheckID"
    );
  });
});
