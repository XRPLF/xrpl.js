const { encode, decode } = require("./../dist/index");
const fixtures = require("./fixtures/x-codec-fixtures.json");

let json_x1 = {
  OwnerCount: 0,
  Account: "XVXdn5wEVm5G4UhEHWDPqjvdeH361P7BsapL4m2D2XnPSwT",
  PreviousTxnLgrSeq: 7,
  LedgerEntryType: "AccountRoot",
  PreviousTxnID:
    "DF530FB14C5304852F20080B0A8EEF3A6BDD044F41F4EBBD68B8B321145FE4FF",
  Flags: 0,
  Sequence: 1,
  Balance: "10000000000",
};

let json_r1 = {
  OwnerCount: 0,
  Account: "rLs1MzkFWCxTbuAHgjeTZK4fcCDDnf2KRv",
  PreviousTxnLgrSeq: 7,
  LedgerEntryType: "AccountRoot",
  PreviousTxnID:
    "DF530FB14C5304852F20080B0A8EEF3A6BDD044F41F4EBBD68B8B321145FE4FF",
  Flags: 0,
  Sequence: 1,
  Balance: "10000000000",
  SourceTag: 12345,
};

let json_null_x = {
  OwnerCount: 0,
  Account: "rLs1MzkFWCxTbuAHgjeTZK4fcCDDnf2KRv",
  Destination: "rLs1MzkFWCxTbuAHgjeTZK4fcCDDnf2KRv",
  Issuer: "XVXdn5wEVm5G4UhEHWDPqjvdeH361P4GETfNyyXGaoqBj71",
  PreviousTxnLgrSeq: 7,
  LedgerEntryType: "AccountRoot",
  PreviousTxnID:
    "DF530FB14C5304852F20080B0A8EEF3A6BDD044F41F4EBBD68B8B321145FE4FF",
  Flags: 0,
  Sequence: 1,
  Balance: "10000000000",
};

let json_invalid_x = {
  OwnerCount: 0,
  Account: "rLs1MzkFWCxTbuAHgjeTZK4fcCDDnf2KRv",
  Destination: "rLs1MzkFWCxTbuAHgjeTZK4fcCDDnf2KRv",
  Issuer: "XVXdn5wEVm5g4UhEHWDPqjvdeH361P4GETfNyyXGaoqBj71",
  PreviousTxnLgrSeq: 7,
  LedgerEntryType: "AccountRoot",
  PreviousTxnID:
    "DF530FB14C5304852F20080B0A8EEF3A6BDD044F41F4EBBD68B8B321145FE4FF",
  Flags: 0,
  Sequence: 1,
  Balance: "10000000000",
};

let json_null_r = {
  OwnerCount: 0,
  Account: "rLs1MzkFWCxTbuAHgjeTZK4fcCDDnf2KRv",
  Destination: "rLs1MzkFWCxTbuAHgjeTZK4fcCDDnf2KRv",
  Issuer: "rLs1MzkFWCxTbuAHgjeTZK4fcCDDnf2KRv",
  PreviousTxnLgrSeq: 7,
  LedgerEntryType: "AccountRoot",
  PreviousTxnID:
    "DF530FB14C5304852F20080B0A8EEF3A6BDD044F41F4EBBD68B8B321145FE4FF",
  Flags: 0,
  Sequence: 1,
  Balance: "10000000000",
};

let invalid_json_issuer_tagged = {
  OwnerCount: 0,
  Account: "rLs1MzkFWCxTbuAHgjeTZK4fcCDDnf2KRv",
  Destination: "rLs1MzkFWCxTbuAHgjeTZK4fcCDDnf2KRv",
  Issuer: "XVXdn5wEVm5G4UhEHWDPqjvdeH361P7BsapL4m2D2XnPSwT",
  PreviousTxnLgrSeq: 7,
  LedgerEntryType: "AccountRoot",
  PreviousTxnID:
    "DF530FB14C5304852F20080B0A8EEF3A6BDD044F41F4EBBD68B8B321145FE4FF",
  Flags: 0,
  Sequence: 1,
  Balance: "10000000000",
};

let invalid_json_x_and_tagged = {
  OwnerCount: 0,
  Account: "XVXdn5wEVm5G4UhEHWDPqjvdeH361P7BsapL4m2D2XnPSwT",
  PreviousTxnLgrSeq: 7,
  LedgerEntryType: "AccountRoot",
  PreviousTxnID:
    "DF530FB14C5304852F20080B0A8EEF3A6BDD044F41F4EBBD68B8B321145FE4FF",
  Flags: 0,
  Sequence: 1,
  Balance: "10000000000",
  SourceTag: 12345,
};

describe("X-Address Account is equivalent to a classic address w/ SourceTag", () => {
  let encoded_x = encode(json_x1);
  let encoded_r = encode(json_r1);
  test("Can encode with x-Address", () => {
    expect(encoded_x).toEqual(encoded_r);
  });

  test("decoded X-address is object w/ source and tag", () => {
    let decoded_x = decode(encoded_x);
    expect(decoded_x).toEqual(json_r1);
  });

  test("Encoding issuer X-Address w/ undefined destination tag", () => {
    expect(encode(json_null_x)).toEqual(encode(json_null_r));
  });

  test("Throws when X-Address is invalid", () => {
    expect(() => encode(json_invalid_x)).toThrow("checksum_invalid");
  });
});

describe("Invalid X-Address behavior", () => {
  test("X-Address with tag throws value for invalid field", () => {
    expect(() => encode(invalid_json_issuer_tagged)).toThrow(
      new Error("Issuer cannot have an associated tag")
    );
  });

  test("Throws when Account has both X-Addr and Destination Tag", () => {
    expect(() => encode(invalid_json_x_and_tagged)).toThrow(
      new Error("Cannot have Account X-Address and SourceTag")
    );
  });
});

describe("ripple-binary-codec x-address test", function () {
  function makeSuite(name, entries) {
    describe(name, function () {
      entries.forEach((t, testN) => {
        test(`${name}[${testN}] encodes X-address json equivalent to classic address json`, () => {
          expect(encode(t.rjson)).toEqual(encode(t.xjson));
        });
        test(`${name}[${testN}] decodes X-address json equivalent to classic address json`, () => {
          expect(decode(encode(t.xjson))).toEqual(t.rjson);
        });
      });
    });
  }
  makeSuite("transactions", fixtures.transactions);
});
