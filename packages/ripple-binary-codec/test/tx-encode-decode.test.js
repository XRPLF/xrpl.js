const { encode, decode } = require("../dist");

// Notice: no Amount or Fee
const tx_json = {
  Account: "r9LqNeG6qHxjeUocjvVki2XR35weJ9mZgQ",
  // Amount: '1000',
  Destination: "rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh",
  // Fee: '10',

  // JavaScript converts operands to 32-bit signed ints after doing bitwise
  // operations. We need to convert it back to an unsigned int with >>> 0.
  Flags: (1 << 31) >>> 0, // tfFullyCanonicalSig

  Sequence: 1,
  TransactionType: "Payment",
  // TxnSignature,
  // Signature,
  // SigningPubKey
};

describe("encoding and decoding tx_json", function () {
  test("can encode tx_json without Amount or Fee", function () {
    const encoded = encode(tx_json);
    const decoded = decode(encoded);
    expect(tx_json).toEqual(decoded);
  });
  test("can encode tx_json with Amount and Fee", function () {
    const my_tx = Object.assign({}, tx_json, {
      Amount: "1000",
      Fee: "10",
    });
    const encoded = encode(my_tx);
    const decoded = decode(encoded);
    expect(my_tx).toEqual(decoded);
  });
  test("can encode tx_json with TicketCount", function () {
    const my_tx = Object.assign({}, tx_json, {
      TicketCount: 2,
    });
    const encoded = encode(my_tx);
    const decoded = decode(encoded);
    expect(my_tx).toEqual(decoded);
  });
  test("can encode tx_json with TicketSequence", function () {
    const my_tx = Object.assign({}, tx_json, {
      Sequence: 0,
      TicketSequence: 2,
    });
    const encoded = encode(my_tx);
    const decoded = decode(encoded);
    expect(my_tx).toEqual(decoded);
  });
  test("throws when Amount is invalid", function () {
    const my_tx = Object.assign({}, tx_json, {
      Amount: "1000.001",
      Fee: "10",
    });
    expect(() => {
      encode(my_tx);
    }).toThrow();
  });
  test("throws when Fee is invalid", function () {
    const my_tx = Object.assign({}, tx_json, {
      Amount: "1000",
      Fee: "10.123",
    });
    expect(() => {
      encode(my_tx);
    }).toThrow();
  });
  test("throws when Amount and Fee are invalid", function () {
    const my_tx = Object.assign({}, tx_json, {
      Amount: "1000.789",
      Fee: "10.123",
    });
    expect(() => {
      encode(my_tx);
    }).toThrow();
  });
  test("throws when Amount is a number instead of a string-encoded integer", function () {
    const my_tx = Object.assign({}, tx_json, {
      Amount: 1000.789,
    });
    expect(() => {
      encode(my_tx);
    }).toThrow();
  });

  test("throws when Fee is a number instead of a string-encoded integer", function () {
    const my_tx = Object.assign({}, tx_json, {
      Amount: 1234.56,
    });
    expect(() => {
      encode(my_tx);
    }).toThrow();
  });
});
