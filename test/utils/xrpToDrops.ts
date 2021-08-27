import assert from "assert-diff";
import BigNumber from "bignumber.js";

import { xrpToDrops } from "../../src/utils";

describe("XRP To Drops", function () {
  it("works with a typical amount", function () {
    const drops = xrpToDrops("2");
    assert.strictEqual(drops, "2000000", "2 XRP equals 2 million drops");
  });

  it("works with fractions", function () {
    let drops = xrpToDrops("3.456789");
    assert.strictEqual(drops, "3456789", "3.456789 XRP equals 3,456,789 drops");
    drops = xrpToDrops("3.400000");
    assert.strictEqual(drops, "3400000", "3.400000 XRP equals 3,400,000 drops");
    drops = xrpToDrops("0.000001");
    assert.strictEqual(drops, "1", "0.000001 XRP equals 1 drop");
    drops = xrpToDrops("0.0000010");
    assert.strictEqual(drops, "1", "0.0000010 XRP equals 1 drop");
  });

  it("works with zero", function () {
    let drops = xrpToDrops("0");
    assert.strictEqual(drops, "0", "0 XRP equals 0 drops");
    drops = xrpToDrops("-0"); // negative zero is equivalent to zero
    assert.strictEqual(drops, "0", "-0 XRP equals 0 drops");
    drops = xrpToDrops("0.000000");
    assert.strictEqual(drops, "0", "0.000000 XRP equals 0 drops");
    drops = xrpToDrops("0.0000000");
    assert.strictEqual(drops, "0", "0.0000000 XRP equals 0 drops");
  });

  it("works with a negative value", function () {
    const drops = xrpToDrops("-2");
    assert.strictEqual(drops, "-2000000", "-2 XRP equals -2 million drops");
  });

  it("works with a value ending with a decimal point", function () {
    let drops = xrpToDrops("2.");
    assert.strictEqual(drops, "2000000", "2. XRP equals 2000000 drops");
    drops = xrpToDrops("-2.");
    assert.strictEqual(drops, "-2000000", "-2. XRP equals -2000000 drops");
  });

  it("works with BigNumber objects", function () {
    let drops = xrpToDrops(new BigNumber(2));
    assert.strictEqual(
      drops,
      "2000000",
      "(BigNumber) 2 XRP equals 2 million drops"
    );
    drops = xrpToDrops(new BigNumber(-2));
    assert.strictEqual(
      drops,
      "-2000000",
      "(BigNumber) -2 XRP equals -2 million drops"
    );
  });

  it("works with a number", function () {
    // This is not recommended. Use strings or BigNumber objects to avoid precision errors.
    let drops = xrpToDrops(2);
    assert.strictEqual(
      drops,
      "2000000",
      "(number) 2 XRP equals 2 million drops"
    );
    drops = xrpToDrops(-2);
    assert.strictEqual(
      drops,
      "-2000000",
      "(number) -2 XRP equals -2 million drops"
    );
  });

  it("throws with an amount with too many decimal places", function () {
    assert.throws(() => {
      xrpToDrops("1.1234567");
    }, /has too many decimal places/);
    assert.throws(() => {
      xrpToDrops("0.0000001");
    }, /has too many decimal places/);
  });

  it("throws with an invalid value", function () {
    assert.throws(() => {
      xrpToDrops("FOO");
    }, /invalid value/);
    assert.throws(() => {
      xrpToDrops("1e-7");
    }, /invalid value/);
    assert.throws(() => {
      xrpToDrops("2,0");
    }, /invalid value/);
    assert.throws(() => {
      xrpToDrops(".");
    }, /xrpToDrops: invalid value '\.', should be a BigNumber or string-encoded number\./);
  });

  it("throws with an amount more than one decimal point", function () {
    assert.throws(() => {
      xrpToDrops("1.0.0");
    }, /xrpToDrops: invalid value '1\.0\.0'/);
    assert.throws(() => {
      xrpToDrops("...");
    }, /xrpToDrops: invalid value '\.\.\.'/);
  });
});
