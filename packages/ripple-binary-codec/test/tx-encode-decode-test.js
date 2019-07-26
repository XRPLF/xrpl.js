const assert = require('assert');
const {
  encode,
  decode
} = require('../src')

// Notice: no Amount or Fee
const tx_json = {
  Account: 'r9LqNeG6qHxjeUocjvVki2XR35weJ9mZgQ',
  // Amount: '1000',
  Destination: 'rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh',
  // Fee: '10',

  // JavaScript converts operands to 32-bit signed ints after doing bitwise
  // operations. We need to convert it back to an unsigned int with >>> 0.
  Flags: ((1 << 31) >>> 0), // tfFullyCanonicalSig

  Sequence: 1,
  TransactionType: 'Payment'
  // TxnSignature,
  // Signature,
  // SigningPubKey
};

const amount_parameters_message = input => {
  // disables the ESLint rule on the whole rest of the file
  /* eslint-disable max-len */
  return `${input} is an illegal amount

Native values must be described in drops, a million of which equal one XRP.
This must be an integer number, with the absolute value not exceeding 100000000000000000

IOU values must have a maximum precision of 16 significant digits. They are serialized as
a canonicalised mantissa and exponent.

The valid range for a mantissa is between 1000000000000000 and 9999999999999999
The exponent must be >= -96 and <= 80

Thus the largest serializable IOU value is:
999999999999999900000000000000000000000000000000000000000000000000000000000000000000000000000000

And the smallest:
0.000000000000000000000000000000000000000000000000000000000000000000000000000000001
`;
};

describe('encoding and decoding tx_json', function() {
  it('can encode tx_json without Amount or Fee', function() {
    const encoded = encode(tx_json);
    const decoded = decode(encoded);
    assert.deepStrictEqual(tx_json, decoded);
  });
  it('can encode tx_json with Amount and Fee', function() {
    const my_tx = Object.assign({}, tx_json, {
      Amount: '1000',
      Fee: '10'
    });
    const encoded = encode(my_tx);
    const decoded = decode(encoded);
    assert.deepStrictEqual(my_tx, decoded);
  });
  it('throws when Amount is invalid', function() {
    const my_tx = Object.assign({}, tx_json, {
      Amount: '1000.001',
      Fee: '10'
    });
    assert.throws(() => {
      encode(my_tx);
    }, {
      name: 'Error',
      message: amount_parameters_message('1000.001')
    });
  });
  it('throws when Fee is invalid', function() {
    const my_tx = Object.assign({}, tx_json, {
      Amount: '1000',
      Fee: '10.123'
    });
    assert.throws(() => {
      encode(my_tx);
    }, {
      name: 'Error',
      message: amount_parameters_message('10.123')
    });
  });
  it('throws when Amount and Fee are invalid', function() {
    const my_tx = Object.assign({}, tx_json, {
      Amount: '1000.789',
      Fee: '10.123'
    });
    assert.throws(() => {
      encode(my_tx);
    }, {
      name: 'Error',
      message: amount_parameters_message('1000.789')
    });
  });
  it('throws when Amount is a number instead of a string-encoded integer',
    function() {
      const my_tx = Object.assign({}, tx_json, {
        Amount: 1000.789
      });
      assert.throws(() => {
        encode(my_tx);
      },
      {
        name: 'Error',
        message: 'unsupported value: 1000.789'
      });
    });
  it('throws when Fee is a number instead of a string-encoded integer',
    function() {
      const my_tx = Object.assign({}, tx_json, {
        Amount: 1234.56
      });
      assert.throws(() => {
        encode(my_tx);
      },
      {
        name: 'Error',
        message: 'unsupported value: 1234.56'
      });
    });
});
