import { BinaryParser } from '../src/binary'
import { Issue } from '../src/types/issue'

describe('Issue type conversion functions', () => {
  it(`test from value xrp`, () => {
    const xrpJson = { currency: 'XRP' }
    const xrpIssue = Issue.from(xrpJson)
    expect(xrpIssue.toJSON()).toMatchObject(xrpJson)
  })

  it(`test from value issued currency`, () => {
    const iouJson = {
      currency: 'USD',
      issuer: 'rG1QQv2nh2gr7RCZ1P8YYcBUKCCN633jCn',
    }
    const iouIssue = Issue.from(iouJson)
    expect(iouIssue.toJSON()).toMatchObject(iouJson)
  })

  it(`test from value nonstandard currency`, () => {
    const iouJson = {
      currency: '0123456789ABCDEF0123456789ABCDEF01234567',
      issuer: 'rG1QQv2nh2gr7RCZ1P8YYcBUKCCN633jCn',
    }
    const iouIssue = Issue.from(iouJson)
    expect(iouIssue.toJSON()).toMatchObject(iouJson)
  })

  it(`test from value mpt`, () => {
    const mptJson = {
      // value: '100', // MPT amounts must be an integer string (no decimal point)
      mpt_issuance_id: 'BAADF00DBAADF00DBAADF00DBAADF00DBAADF00DBAADF00D',
    }
    const mptIssue = Issue.from(mptJson)
    expect(mptIssue.toJSON()).toMatchObject(mptJson)
  })

  it(`test from parser xrp`, () => {
    const xrpJson = { currency: 'XRP' }
    const xrpIssue = Issue.from(xrpJson)
    const parser = new BinaryParser(xrpIssue.toHex())
    const parserIssue = Issue.fromParser(parser)
    expect(parserIssue.toJSON()).toMatchObject(xrpJson)
  })

  it(`test from parser issued currency`, () => {
    const iouJson = {
      currency: 'EUR',
      issuer: 'rLUEXYuLiQptky37CqLcm9USQpPiz5rkpD',
    }
    const iouIssue = Issue.from(iouJson)
    const parser = new BinaryParser(iouIssue.toHex())
    const parserIssue = Issue.fromParser(parser)
    expect(parserIssue.toJSON()).toMatchObject(iouJson)
  })

  it(`test from parser nonstandard currency`, () => {
    const iouJson = {
      currency: '0123456789ABCDEF0123456789ABCDEF01234567',
      issuer: 'rLUEXYuLiQptky37CqLcm9USQpPiz5rkpD',
    }
    const iouIssue = Issue.from(iouJson)
    const parser = new BinaryParser(iouIssue.toHex())
    const parserIssue = Issue.fromParser(parser)
    expect(parserIssue.toJSON()).toMatchObject(iouJson)
  })

  it(`test from parser mpt`, () => {
    const mptJson = {
      // value: '100', // MPT amounts must be an integer string (no decimal point)
      mpt_issuance_id: 'BAADF00DBAADF00DBAADF00DBAADF00DBAADF00DBAADF00D',
    }
    const mptIssue = Issue.from(mptJson)
    const parser = new BinaryParser(mptIssue.toHex())
    const parserIssue = Issue.fromParser(parser, 24)
    expect(parserIssue.toJSON()).toMatchObject(mptJson)
  })

  it(`throws with invalid input`, () => {
    const invalidJson = { random: 123 }
    expect(() => {
      // @ts-expect-error -- need to test error message
      Issue.from(invalidJson)
    }).toThrow(new Error('Invalid type to construct an Amount'))
  })
})
