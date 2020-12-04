/* eslint-disable func-style */

const { binary } = require("../dist/coretypes");
const { encode, decode } = require("../dist");
const { makeParser, BytesList, BinarySerializer } = binary;
const { coreTypes } = require("../dist/types");
const { UInt8, UInt16, UInt32, UInt64, STObject } = coreTypes;
const bigInt = require("big-integer");
const { Buffer } = require("buffer/");

const { loadFixture } = require("./utils");
const fixtures = loadFixture("data-driven-tests.json");
const deliverMinTx = require("./fixtures/delivermin-tx.json");
const deliverMinTxBinary = require("./fixtures/delivermin-tx-binary.json");
const SignerListSet = {
  tx: require("./fixtures/signerlistset-tx.json"),
  binary: require("./fixtures/signerlistset-tx-binary.json"),
  meta: require("./fixtures/signerlistset-tx-meta-binary.json"),
};
const DepositPreauth = {
  tx: require("./fixtures/deposit-preauth-tx.json"),
  binary: require("./fixtures/deposit-preauth-tx-binary.json"),
  meta: require("./fixtures/deposit-preauth-tx-meta-binary.json"),
};
const Escrow = {
  create: {
    tx: require("./fixtures/escrow-create-tx.json"),
    binary: require("./fixtures/escrow-create-binary.json"),
  },
  finish: {
    tx: require("./fixtures/escrow-finish-tx.json"),
    binary: require("./fixtures/escrow-finish-binary.json"),
    meta: require("./fixtures/escrow-finish-meta-binary.json"),
  },
  cancel: {
    tx: require("./fixtures/escrow-cancel-tx.json"),
    binary: require("./fixtures/escrow-cancel-binary.json"),
  },
};
const PaymentChannel = {
  create: {
    tx: require("./fixtures/payment-channel-create-tx.json"),
    binary: require("./fixtures/payment-channel-create-binary.json"),
  },
  fund: {
    tx: require("./fixtures/payment-channel-fund-tx.json"),
    binary: require("./fixtures/payment-channel-fund-binary.json"),
  },
  claim: {
    tx: require("./fixtures/payment-channel-claim-tx.json"),
    binary: require("./fixtures/payment-channel-claim-binary.json"),
  },
};

const Ticket = {
  create: {
    tx: require("./fixtures/ticket-create-tx.json"),
    binary: require("./fixtures/ticket-create-binary.json"),
  },
};

let json_undefined = {
  TakerPays: "223174650",
  Account: "rPk2dXr27rMw9G5Ej9ad2Tt7RJzGy8ycBp",
  TransactionType: "OfferCreate",
  Memos: [
    {
      Memo: {
        MemoType: "584D4D2076616C7565",
        MemoData: "322E3230393635",
        MemoFormat: undefined,
      },
    },
  ],
  Fee: "15",
  OfferSequence: undefined,
  TakerGets: {
    currency: "XMM",
    value: "100",
    issuer: "rExAPEZvbkZqYPuNcZ7XEBLENEshsWDQc8",
  },
  Flags: 524288,
  Sequence: undefined,
  LastLedgerSequence: 6220135,
};

let json_omitted = {
  TakerPays: "223174650",
  Account: "rPk2dXr27rMw9G5Ej9ad2Tt7RJzGy8ycBp",
  TransactionType: "OfferCreate",
  Memos: [
    {
      Memo: {
        MemoType: "584D4D2076616C7565",
        MemoData: "322E3230393635",
      },
    },
  ],
  Fee: "15",
  TakerGets: {
    currency: "XMM",
    value: "100",
    issuer: "rExAPEZvbkZqYPuNcZ7XEBLENEshsWDQc8",
  },
  Flags: 524288,
  LastLedgerSequence: 6220135,
};

const NegativeUNL = require("./fixtures/negative-unl.json");

function bytesListTest() {
  const list = new BytesList()
    .put(Buffer.from([0]))
    .put(Buffer.from([2, 3]))
    .put(Buffer.from([4, 5]));
  test("is an Array<Buffer>", function () {
    expect(Array.isArray(list.bytesArray)).toBe(true);
    expect(list.bytesArray[0] instanceof Buffer).toBe(true);
  });
  test("keeps track of the length itself", function () {
    expect(list.getLength()).toBe(5);
  });
  test("can join all arrays into one via toBytes", function () {
    const joined = list.toBytes();
    expect(joined).toHaveLength(5);
    expect(joined).toEqual(Buffer.from([0, 2, 3, 4, 5]));
  });
}

function assertRecycles(blob) {
  const parser = makeParser(blob);
  const so = parser.readType(STObject);
  const out = new BytesList();
  so.toBytesSink(out);
  const hex = out.toHex();
  expect(hex).toEqual(blob);
  expect(hex + ":").not.toEqual(blob);
}

function nestedObjectTests() {
  fixtures.whole_objects.forEach((f, i) => {
    /*eslint-disable jest/expect-expect*/
    test(`whole_objects[${i}]: can parse blob and dump out same blob`, () => {
      assertRecycles(f.blob_with_no_signing);
    });
    /*eslint-enable jest/expect-expect*/
  });
}

function check(type, n, expected) {
  test(`Uint${type.width * 8} serializes ${n} as ${expected}`, function () {
    const bl = new BytesList();
    const serializer = new BinarySerializer(bl);
    if (expected === "throws") {
      expect(() => serializer.writeType(type, n)).toThrow();
      return;
    }
    serializer.writeType(type, n);
    expect(bl.toBytes()).toEqual(Buffer.from(expected));
  });
}

check(UInt8, 5, [5]);
check(UInt16, 5, [0, 5]);
check(UInt32, 5, [0, 0, 0, 5]);
check(UInt32, 0xffffffff, [255, 255, 255, 255]);
check(UInt8, 0xfeffffff, "throws");
check(UInt16, 0xfeffffff, "throws");
check(UInt16, 0xfeffffff, "throws");
check(UInt64, 0xfeffffff, [0, 0, 0, 0, 254, 255, 255, 255]);
check(UInt64, -1, "throws");
check(UInt64, 0, [0, 0, 0, 0, 0, 0, 0, 0]);
check(UInt64, 1, [0, 0, 0, 0, 0, 0, 0, 1]);
check(UInt64, bigInt(1), [0, 0, 0, 0, 0, 0, 0, 1]);

function deliverMinTest() {
  test("can serialize DeliverMin", () => {
    expect(encode(deliverMinTx)).toEqual(deliverMinTxBinary);
  });
}

function SignerListSetTest() {
  test("can serialize SignerListSet", () => {
    expect(encode(SignerListSet.tx)).toEqual(SignerListSet.binary);
  });
  test("can serialize SignerListSet metadata", () => {
    expect(encode(SignerListSet.tx.meta)).toEqual(SignerListSet.meta);
  });
}

function DepositPreauthTest() {
  test("can serialize DepositPreauth", () => {
    expect(encode(DepositPreauth.tx)).toEqual(DepositPreauth.binary);
  });
  test("can serialize DepositPreauth metadata", () => {
    expect(encode(DepositPreauth.tx.meta)).toEqual(DepositPreauth.meta);
  });
}

function EscrowTest() {
  test("can serialize EscrowCreate", () => {
    expect(encode(Escrow.create.tx)).toEqual(Escrow.create.binary);
  });
  test("can serialize EscrowFinish", () => {
    expect(encode(Escrow.finish.tx)).toEqual(Escrow.finish.binary);
    expect(encode(Escrow.finish.tx.meta)).toEqual(Escrow.finish.meta);
  });
  test("can serialize EscrowCancel", () => {
    expect(encode(Escrow.cancel.tx)).toEqual(Escrow.cancel.binary);
  });
}

function PaymentChannelTest() {
  test("can serialize PaymentChannelCreate", () => {
    expect(encode(PaymentChannel.create.tx)).toEqual(
      PaymentChannel.create.binary
    );
  });
  test("can serialize PaymentChannelFund", () => {
    expect(encode(PaymentChannel.fund.tx)).toEqual(PaymentChannel.fund.binary);
  });
  test("can serialize PaymentChannelClaim", () => {
    expect(encode(PaymentChannel.claim.tx)).toEqual(
      PaymentChannel.claim.binary
    );
  });
}

function NegativeUNLTest() {
  test("can serialize NegativeUNL", () => {
    expect(encode(NegativeUNL.tx)).toEqual(NegativeUNL.binary);
  });
  test("can deserialize NegativeUNL", () => {
    expect(decode(NegativeUNL.binary)).toEqual(NegativeUNL.tx);
  });
}

function omitUndefinedTest() {
  test("omits fields with undefined value", () => {
    let encodedOmitted = encode(json_omitted);
    let encodedUndefined = encode(json_undefined);
    expect(encodedOmitted).toEqual(encodedUndefined);
    expect(decode(encodedOmitted)).toEqual(decode(encodedUndefined));
  });
}

function ticketTest() {
  test("can serialize TicketCreate", () => {
    expect(encode(Ticket.create.tx)).toEqual(Ticket.create.binary);
  });
}

describe("Binary Serialization", function () {
  describe("nestedObjectTests", () => nestedObjectTests());
  describe("BytesList", () => bytesListTest());
  describe("DeliverMin", () => deliverMinTest());
  describe("DepositPreauth", () => DepositPreauthTest());
  describe("SignerListSet", () => SignerListSetTest());
  describe("Escrow", () => EscrowTest());
  describe("PaymentChannel", () => PaymentChannelTest());
  describe("NegativeUNLTest", () => NegativeUNLTest());
  describe("OmitUndefined", () => omitUndefinedTest());
  describe("TicketTest", () => ticketTest());
});
