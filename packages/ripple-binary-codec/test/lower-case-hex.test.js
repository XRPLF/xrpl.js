const { encode, decode } = require('../dist')

let str =
  '1100612200000000240000000125000068652D0000000055B6632D6376A2D9319F20A1C6DCCB486432D1E4A79951229D4C3DE2946F51D56662400009184E72A00081140DD319918CD5AE792BF7EC80D63B0F01B4573BBC'
let lower = str.toLowerCase()

let bin =
  '1100612200000000240000000125000000082D00000000550735A0B32B2A3F4C938B76D6933003E29447DB8C7CE382BBE089402FF12A03E56240000002540BE400811479927BAFFD3D04A26096C0C97B1B0D45B01AD3C0'
let json = {
  OwnerCount: 0,
  Account: 'rUnFEsHjxqTswbivzL2DNHBb34rhAgZZZK',
  PreviousTxnLgrSeq: 8,
  LedgerEntryType: 'AccountRoot',
  PreviousTxnID:
    '0735A0B32B2A3F4C938B76D6933003E29447DB8C7CE382BBE089402FF12A03E5'.toLowerCase(),
  Flags: 0,
  Sequence: 1,
  Balance: '10000000000',
}

let jsonUpper = {
  OwnerCount: 0,
  Account: 'rUnFEsHjxqTswbivzL2DNHBb34rhAgZZZK',
  PreviousTxnLgrSeq: 8,
  LedgerEntryType: 'AccountRoot',
  PreviousTxnID:
    '0735A0B32B2A3F4C938B76D6933003E29447DB8C7CE382BBE089402FF12A03E5',
  Flags: 0,
  Sequence: 1,
  Balance: '10000000000',
}

describe('Lowercase hex test', () => {
  test('Correctly decodes', () => {
    expect(decode(lower)).toEqual(decode(str))
  })
  test('Re-encodes to uppercase hex', () => {
    expect(encode(decode(lower))).toEqual(str)
  })
  test('Encode when hex field lowercase', () => {
    expect(encode(json)).toBe(bin)
  })
  test('Re-decodes to uppercase hex', () => {
    expect(decode(encode(json))).toEqual(jsonUpper)
  })
})
