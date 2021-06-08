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

const binaryEntry1 =
  "1100642200000000320000000000000002580CB3C1AD2C371136AEA434246D971C5FCCD32CBF520667E131AB7B10D706E7528214BA53D10260FFCC968ACD16BA30F7CEABAD6E5D92011340A3454ACED87177146EABD5E4A256021D836D1E3617618B1EB362D10B0D1BAC6AE1ED9E8D280BBE0B6656748FD647231851C6C650794D5E6852DFA1E35E68630F";
const jsonEntry1 = {
  Flags: 0,
  IndexPrevious: "2",
  Indexes: [
    "A3454ACED87177146EABD5E4A256021D836D1E3617618B1EB362D10B0D1BAC6A",
    "E1ED9E8D280BBE0B6656748FD647231851C6C650794D5E6852DFA1E35E68630F",
  ],
  LedgerEntryType: "DirectoryNode",
  Owner: "rHzDaMNybxQppiE3uWyt2N265KvAKdiRdP",
  RootIndex: "0CB3C1AD2C371136AEA434246D971C5FCCD32CBF520667E131AB7B10D706E752",
  index: "0B4A2E68C111F7E42FAEEE405F7344560C8240840B151D9D04131EB79D080167",
};

const binaryEntry2 =
  "1100722200210000250178D1CA37000000000000000038000000000000028355C0C37CE200B509E0A529880634F7841A9EF4CB65F03C12E6004CFAD9718D66946280000000000000000000000000000000000000004743420000000000000000000000000000000000000000000000000166D6071AFD498D000000000000000000000000000047434200000000002599D1D255BCA61189CA64C84528F2FCBE4BFC3867800000000000000000000000000000000000000047434200000000006EEBB1D1852CE667876A0B3630861FB6C6AB358E";
const jsonEntry2 = {
  Balance: {
    currency: "GCB",
    issuer: "rrrrrrrrrrrrrrrrrrrrBZbvji",
    value: "0",
  },
  Flags: 2162688,
  HighLimit: {
    currency: "GCB",
    issuer: "rBfVgTnsdh8ckC19RM8aVGNuMZnpwrMP6n",
    value: "0",
  },
  HighNode: "283",
  LedgerEntryType: "RippleState",
  LowLimit: {
    currency: "GCB",
    issuer: "rhRFGCy2RJTA8oxkjjtYTvofPVGqcgvXWj",
    value: "2000000",
  },
  LowNode: "0",
  PreviousTxnID:
    "C0C37CE200B509E0A529880634F7841A9EF4CB65F03C12E6004CFAD9718D6694",
  PreviousTxnLgrSeq: 24695242,
  index: "0000041EFD027808D3F78C8352F97E324CB816318E00B977C74ECDDC7CD975B2",
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

test("UInt64 from non 16 length hex", () => {
  expect(encode(jsonEntry1)).toEqual(binaryEntry1);
  expect(encode(jsonEntry2)).toEqual(binaryEntry2);
});

test("valueOfTests", () => {
  let val = UInt8.from(1);
  val |= 0x2;
  expect(val).toBe(3);
});
