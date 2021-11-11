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

let json_issued_x = {
  TakerPays: {
    currency: "USD",
    issuer: "X7WZKEeNVS2p9Tire9DtNFkzWBZbFtJHWxDjN9fCrBGqVA4",
    value: "7072.8",
  },
};

let json_issued_r = {
  TakerPays: {
    currency: "USD",
    issuer: "rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B",
    value: "7072.8",
  },
};

let json_issued_with_tag = {
  TakerPays: {
    currency: "USD",
    issuer: "X7WZKEeNVS2p9Tire9DtNFkzWBZbFtSiS2eDBib7svZXuc2",
    value: "7072.8",
  },
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

  test("Encodes issued currency w/ x-address", () => {
    expect(encode(json_issued_x)).toEqual(encode(json_issued_r));
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

  test("Throws when issued currency has tag", () => {
    expect(() => encode(json_issued_with_tag)).toThrow(
      "Only allowed to have tag on Account or Destination"
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
