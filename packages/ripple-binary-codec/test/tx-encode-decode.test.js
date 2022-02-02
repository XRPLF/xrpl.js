const { encode, decode } = require('../dist')

// Notice: no Amount or Fee
const tx_json = {
  Account: 'r9LqNeG6qHxjeUocjvVki2XR35weJ9mZgQ',
  // Amount: '1000',
  Destination: 'rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh',
  // Fee: '10',

  // JavaScript converts operands to 32-bit signed ints after doing bitwise
  // operations. We need to convert it back to an unsigned int with >>> 0.
  Flags: (1 << 31) >>> 0, // tfFullyCanonicalSig

  Sequence: 1,
  TransactionType: 'Payment',
  // TxnSignature,
  // Signature,
  // SigningPubKey
}

describe('encoding and decoding tx_json', function () {
  test('can encode tx_json without Amount or Fee', function () {
    const encoded = encode(tx_json)
    const decoded = decode(encoded)
    expect(tx_json).toEqual(decoded)
  })
  test('can encode tx_json with Amount and Fee', function () {
    const my_tx = Object.assign({}, tx_json, {
      Amount: '1000',
      Fee: '10',
    })
    const encoded = encode(my_tx)
    const decoded = decode(encoded)
    expect(my_tx).toEqual(decoded)
  })
  test('can encode tx_json with TicketCount', function () {
    const my_tx = Object.assign({}, tx_json, {
      TicketCount: 2,
    })
    const encoded = encode(my_tx)
    const decoded = decode(encoded)
    expect(my_tx).toEqual(decoded)
  })
  test('can encode tx_json with TicketSequence', function () {
    const my_tx = Object.assign({}, tx_json, {
      Sequence: 0,
      TicketSequence: 2,
    })
    const encoded = encode(my_tx)
    const decoded = decode(encoded)
    expect(my_tx).toEqual(decoded)
  })
  test('can decode a transaction with an issued currency that evaluates to XRP', function () {
    // Encoding is done prior, because this is disallowed during encoding with client libraries to avoid scam XRP tokens.
    const expectedTx = {
      TransactionType: 'TrustSet',
      Flags: 0,
      Sequence: 19,
      LimitAmount: {
        value: '200',
        currency: '0000000000000000000000005852500000000000',
        issuer: 'r9hEDb4xBGRfBCcX3E4FirDWQBAYtpxC8K',
      },
      Fee: '10',
      SigningPubKey:
        '023076CBB7A61837F1A23D4A3DD7CE810B694992EB0959AB9D6F4BB6FED6F8CC26',
      TxnSignature:
        '304502202D0CD77D8E765E3783C309CD663723B18406B7950A348A6F301492916A990FC70221008A76D586111205304F10ADEFDFDDAF804EF202D8CD1E492DC6E1AA8030EA1844',
      Account: 'rPtfQWdcdhuL9eNeNv5YfmekSX3K7vJHbG',
    }
    const encoded = encode(expectedTx)
    const decoded = decode(encoded)
    expect(expectedTx).toEqual(decoded)
  })
  test('throws when Amount is invalid', function () {
    const my_tx = Object.assign({}, tx_json, {
      Amount: '1000.001',
      Fee: '10',
    })
    expect(() => {
      encode(my_tx)
    }).toThrow()
  })
  test('throws when Fee is invalid', function () {
    const my_tx = Object.assign({}, tx_json, {
      Amount: '1000',
      Fee: '10.123',
    })
    expect(() => {
      encode(my_tx)
    }).toThrow()
  })
  test('throws when Amount and Fee are invalid', function () {
    const my_tx = Object.assign({}, tx_json, {
      Amount: '1000.789',
      Fee: '10.123',
    })
    expect(() => {
      encode(my_tx)
    }).toThrow()
  })
  test('throws when Amount is a number instead of a string-encoded integer', function () {
    const my_tx = Object.assign({}, tx_json, {
      Amount: 1000.789,
    })
    expect(() => {
      encode(my_tx)
    }).toThrow()
  })

  test('throws when Fee is a number instead of a string-encoded integer', function () {
    const my_tx = Object.assign({}, tx_json, {
      Amount: 1234.56,
    })
    expect(() => {
      encode(my_tx)
    }).toThrow()
  })
})
