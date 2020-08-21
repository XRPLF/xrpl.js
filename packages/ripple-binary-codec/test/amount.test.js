const { loadFixture } = require("./utils");
const { coreTypes } = require("../dist/types");
const { Amount } = coreTypes;
const fixtures = loadFixture("data-driven-tests.json");

function amountErrorTests() {
  fixtures.values_tests
    .filter((obj) => obj.type === "Amount")
    .forEach((f) => {
      // We only want these with errors
      if (!f.error) {
        return;
      }
      const testName =
        `${JSON.stringify(f.test_json)}\n\tis invalid ` + `because: ${f.error}`;
      it(testName, () => {
        expect(() => {
          Amount.from(f.test_json);
          JSON.stringify(f.test_json);
        }).toThrow();
      });
    });
}

describe("Amount", function () {
  it("can be parsed from", function () {
    expect(Amount.from("1000000") instanceof Amount).toBe(true);
    expect(Amount.from("1000000").toJSON()).toEqual("1000000");
    const fixture = {
      value: "1",
      issuer: "0000000000000000000000000000000000000000",
      currency: "USD",
    };
    const amt = Amount.from(fixture);
    const rewritten = {
      value: "1",
      issuer: "rrrrrrrrrrrrrrrrrrrrrhoLvTp",
      currency: "USD",
    };
    expect(amt.toJSON()).toEqual(rewritten);
  });
  amountErrorTests();
});
