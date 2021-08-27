import BigNumber from "bignumber.js";
import { assert } from "chai";

import { dropsToXrp } from "../../src/utils";

describe("Drops To XRP", function () {
  it("works with a typical amount", function () {
    const xrp = dropsToXrp("2000000");
    assert.strictEqual(xrp, "2", "2 million drops equals 2 XRP");
  });

  it("works with fractions", function () {
    let xrp = dropsToXrp("3456789");
    assert.strictEqual(xrp, "3.456789", "3,456,789 drops equals 3.456789 XRP");

    xrp = dropsToXrp("3400000");
    assert.strictEqual(xrp, "3.4", "3,400,000 drops equals 3.4 XRP");

    xrp = dropsToXrp("1");
    assert.strictEqual(xrp, "0.000001", "1 drop equals 0.000001 XRP");

    xrp = dropsToXrp("1.0");
    assert.strictEqual(xrp, "0.000001", "1.0 drops equals 0.000001 XRP");

    xrp = dropsToXrp("1.00");
    assert.strictEqual(xrp, "0.000001", "1.00 drops equals 0.000001 XRP");
  });

  it("works with zero", function () {
    let xrp = dropsToXrp("0");
    assert.strictEqual(xrp, "0", "0 drops equals 0 XRP");

    // negative zero is equivalent to zero
    xrp = dropsToXrp("-0");
    assert.strictEqual(xrp, "0", "-0 drops equals 0 XRP");

    xrp = dropsToXrp("0.00");
    assert.strictEqual(xrp, "0", "0.00 drops equals 0 XRP");

    xrp = dropsToXrp("000000000");
    assert.strictEqual(xrp, "0", "000000000 drops equals 0 XRP");
  });

  it("works with a negative value", function () {
    const xrp = dropsToXrp("-2000000");
    assert.strictEqual(xrp, "-2", "-2 million drops equals -2 XRP");
  });

  it("works with a value ending with a decimal point", function () {
    let xrp = dropsToXrp("2000000.");
    assert.strictEqual(xrp, "2", "2000000. drops equals 2 XRP");

    xrp = dropsToXrp("-2000000.");
    assert.strictEqual(xrp, "-2", "-2000000. drops equals -2 XRP");
  });

  it("works with BigNumber objects", function () {
    let xrp = dropsToXrp(new BigNumber(2000000));
    assert.strictEqual(xrp, "2", "(BigNumber) 2 million drops equals 2 XRP");

    xrp = dropsToXrp(new BigNumber(-2000000));
    assert.strictEqual(xrp, "-2", "(BigNumber) -2 million drops equals -2 XRP");

    xrp = dropsToXrp(new BigNumber(2345678));
    assert.strictEqual(
      xrp,
      "2.345678",
      "(BigNumber) 2,345,678 drops equals 2.345678 XRP"
    );

    xrp = dropsToXrp(new BigNumber(-2345678));
    assert.strictEqual(
      xrp,
      "-2.345678",
      "(BigNumber) -2,345,678 drops equals -2.345678 XRP"
    );
  });

  it("works with a number", function () {
    // This is not recommended. Use strings or BigNumber objects to avoid precision errors.
    let xrp = dropsToXrp(2000000);
    assert.strictEqual(xrp, "2", "(number) 2 million drops equals 2 XRP");
    xrp = dropsToXrp(-2000000);
    assert.strictEqual(xrp, "-2", "(number) -2 million drops equals -2 XRP");
  });

  it("throws with an amount with too many decimal places", function () {
    assert.throws(() => {
      dropsToXrp("1.2");
    }, /has too many decimal places/);

    assert.throws(() => {
      dropsToXrp("0.10");
    }, /has too many decimal places/);
  });

  it("throws with an invalid value", function () {
    assert.throws(() => {
      dropsToXrp("FOO");
    }, /invalid value/);

    assert.throws(() => {
      dropsToXrp("1e-7");
    }, /invalid value/);

    assert.throws(() => {
      dropsToXrp("2,0");
    }, /invalid value/);

    assert.throws(() => {
      dropsToXrp(".");
    }, /dropsToXrp: invalid value '\.', should be a BigNumber or string-encoded number\./);
  });

  it("throws with an amount more than one decimal point", function () {
    assert.throws(() => {
      dropsToXrp("1.0.0");
    }, /dropsToXrp: invalid value '1\.0\.0'/);

    assert.throws(() => {
      dropsToXrp("...");
    }, /dropsToXrp: invalid value '\.\.\.'/);
  });
});
