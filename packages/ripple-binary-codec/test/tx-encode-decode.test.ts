import { encode, decode } from '../src'

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
  it('can encode tx_json without Amount or Fee', function () {
    const encoded = encode(tx_json)
    const decoded = decode(encoded)
    expect(tx_json).toEqual(decoded)
  })
  it('can encode tx_json with Amount and Fee', function () {
    const my_tx = Object.assign({}, tx_json, {
      Amount: '1000',
      Fee: '10',
    })
    const encoded = encode(my_tx)
    const decoded = decode(encoded)
    expect(my_tx).toEqual(decoded)
  })
  it('can encode tx_json with TicketCount', function () {
    const my_tx = Object.assign({}, tx_json, {
      TicketCount: 2,
    })
    const encoded = encode(my_tx)
    const decoded = decode(encoded)
    expect(my_tx).toEqual(decoded)
  })
  it('can encode tx_json with TicketSequence', function () {
    const my_tx = Object.assign({}, tx_json, {
      Sequence: 0,
      TicketSequence: 2,
    })
    const encoded = encode(my_tx)
    const decoded = decode(encoded)
    expect(my_tx).toEqual(decoded)
  })
  it('can decode a transaction with an issued currency that evaluates to XRP', function () {
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
  it('throws when Amount is invalid', function () {
    const my_tx = Object.assign({}, tx_json, {
      Amount: '1000.001',
      Fee: '10',
    })
    expect(() => {
      encode(my_tx)
    }).toThrow()
  })
  it('throws when Fee is invalid', function () {
    const my_tx = Object.assign({}, tx_json, {
      Amount: '1000',
      Fee: '10.123',
    })
    expect(() => {
      encode(my_tx)
    }).toThrow()
  })
  it('throws when Amount and Fee are invalid', function () {
    const my_tx = Object.assign({}, tx_json, {
      Amount: '1000.789',
      Fee: '10.123',
    })
    expect(() => {
      encode(my_tx)
    }).toThrow()
  })
  it('throws when Amount is a number instead of a string-encoded integer', function () {
    const my_tx = Object.assign({}, tx_json, {
      Amount: 1000.789,
    })
    expect(() => {
      encode(my_tx)
    }).toThrow()
  })

  it('throws when Fee is a number instead of a string-encoded integer', function () {
    const my_tx = Object.assign({}, tx_json, {
      Amount: 1234.56,
    })
    expect(() => {
      encode(my_tx)
    }).toThrow()
  })

  it('throws when there is an unknown field', function () {
    const my_tx = Object.assign({}, tx_json, {
      BadField: 1,
    })
    expect(() => {
      encode(my_tx)
    }).toThrow()
  })

  it('throws when decoding a transaction with a duplicate field', function () {
    // Same blob as encode(tx_json with Amount 1000, Fee 12), but with a
    // second Amount field (61 40000000000F4240, i.e. 1000000 drops) spliced
    // in right after the first one. rippled rejects such blobs, so decode
    // must not silently keep the last value.
    const duplicateAmount =
      '120000220000000024000000016140000000000003E8' +
      '6140000000000F4240' +
      '68400000000000000C8114B5F762798A53D543A014CAF8B297CFF8F2F937E88314F667B0CA50CC7709A220B0561B85E53A48461FA8'
    expect(() => {
      decode(duplicateAmount)
    }).toThrow('Duplicate field detected: Amount')
  })

  it('throws when decoding a transaction with a duplicate Sequence', function () {
    // Valid Payment blob with the Sequence field (24 00000001) repeated.
    const duplicateSequence =
      '1200002200000000240000000124000000016140000000000003E8' +
      '68400000000000000C8114B5F762798A53D543A014CAF8B297CFF8F2F937E88314F667B0CA50CC7709A220B0561B85E53A48461FA8'
    expect(() => {
      decode(duplicateSequence)
    }).toThrow('Duplicate field detected: Sequence')
  })

  it('throws when decoding a transaction with a duplicate nested field', function () {
    // Valid Payment with one Memo, but the MemoData field (7D 04 DEADBEEF)
    // appears twice inside the same Memo object.
    const duplicateMemoData =
      '120000220000000024000000016140000000000003E8' +
      '68400000000000000C8114B5F762798A53D543A014CAF8B297CFF8F2F937E88314F667B0CA50CC7709A220B0561B85E53A48461FA8' +
      'F9EA7D04DEADBEEF7D04DEADBEEF7E097478742F706C61696EE1F1'
    expect(() => {
      decode(duplicateMemoData)
    }).toThrow('Duplicate field detected: MemoData')
  })

  it('allows the same field name in different objects', function () {
    // Two Memos each carry their own MemoData: same field name, different
    // objects, so decoding must still succeed.
    const my_tx = Object.assign({}, tx_json, {
      Amount: '1000',
      Fee: '10',
      Memos: [{ Memo: { MemoData: 'AABB' } }, { Memo: { MemoData: 'CCDD' } }],
    })
    const encoded = encode(my_tx)
    expect(decode(encoded)).toEqual(my_tx)
  })
})
