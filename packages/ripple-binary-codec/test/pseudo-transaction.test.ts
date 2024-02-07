import { encode, decode } from '../src'

let json = {
  Account: 'rrrrrrrrrrrrrrrrrrrrrhoLvTp',
  Sequence: 0,
  Fee: '0',
  SigningPubKey: '',
  Signature: '',
}

let json_blank_acct = {
  Account: '',
  Sequence: 0,
  Fee: '0',
  SigningPubKey: '',
  Signature: '',
}

let binary =
  '24000000006840000000000000007300760081140000000000000000000000000000000000000000'

describe('Can encode Pseudo Transactions', () => {
  it('Correctly encodes Pseudo Transaciton', () => {
    expect(encode(json)).toEqual(binary)
  })

  it('Can decode account objects', () => {
    expect(decode(encode(json))).toEqual(json)
  })

  it('Blank AccountID is ACCOUNT_ZERO', () => {
    expect(encode(json_blank_acct)).toEqual(binary)
  })

  it('Decodes Blank AccountID', () => {
    expect(decode(encode(json_blank_acct))).toEqual(json)
  })
})
