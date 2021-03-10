const { coreTypes } = require("../dist/types");
const { UInt8, UInt64 } = coreTypes;

const { encode } = require("../dist");

const binary =
  "11007222000300003700000000000000003800000000000000006280000000000000000000000000000000000000005553440000000000000000000000000000000000000000000000000166D5438D7EA4C680000000000000000000000000005553440000000000AE123A8556F3CF91154711376AFB0F894F832B3D67D5438D7EA4C680000000000000000000000000005553440000000000F51DFC2A09D62CBBA1DFBDD4691DAC96AD98B90F";
const json = {
  Balance: {
    currency: "USD",
    issuer: "rrrrrrrrrrrrrrrrrrrrBZbvji",
    value: "0",
  },
  Flags: 196608,
  HighLimit: {
    currency: "USD",
    issuer: "rPMh7Pi9ct699iZUTWaytJUoHcJ7cgyziK",
    value: "1000",
  },
  HighNode: "0",
  LedgerEntryType: "RippleState",
  LowLimit: {
    currency: "USD",
    issuer: "rG1QQv2nh2gr7RCZ1P8YYcBUKCCN633jCn",
    value: "1000",
  },
  LowNode: "0",
};

test("compareToTests[0]", () => {
  expect(UInt8.from(124).compareTo(UInt64.from(124))).toBe(0);
});

test("compareToTest[1]", () => {
  expect(UInt64.from(124).compareTo(UInt8.from(124))).toBe(0);
});

test("compareToTest[2]", () => {
  expect(UInt64.from(124).compareTo(UInt8.from(123))).toBe(1);
});

test("compareToTest[3]", () => {
  expect(UInt8.from(124).compareTo(UInt8.from(13))).toBe(1);
});

test("compareToTest[4]", () => {
  expect(UInt8.from(124).compareTo(124)).toBe(0);
});

test("compareToTest[5]", () => {
  expect(UInt64.from(124).compareTo(124)).toBe(0);
});

test("compareToTest[6]", () => {
  expect(UInt64.from(124).compareTo(123)).toBe(1);
});

test("compareToTest[7]", () => {
  expect(UInt8.from(124).compareTo(13)).toBe(1);
});

test("UInt64 from string zero", () => {
  expect(UInt64.from("0")).toEqual(UInt64.from(0));
  expect(encode(json)).toEqual(binary);
});

test("valueOfTests", () => {
  let val = UInt8.from(1);
  val |= 0x2;
  expect(val).toBe(3);
});
