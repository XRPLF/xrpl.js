import { BinaryParser } from '../src/binary'
import { Issue } from '../src/types/issue'

describe('Issue type conversion functions', () => {
  it(`test from value xrp`, () => {
    const xrpJson = { currency: 'XRP' }
    const xrpIssue = Issue.from(xrpJson)
    expect(xrpIssue.toJSON()).toEqual(xrpJson)
  })

  it(`test from value issued currency`, () => {
    const iouJson = {
      currency: 'USD',
      issuer: 'rG1QQv2nh2gr7RCZ1P8YYcBUKCCN633jCn',
    }
    const iouIssue = Issue.from(iouJson)
    expect(iouIssue.toJSON()).toEqual(iouJson)
  })

  it(`test from value non-standard currency`, () => {
    const iouJson = {
      currency: '0123456789ABCDEF0123456789ABCDEF01234567',
      issuer: 'rG1QQv2nh2gr7RCZ1P8YYcBUKCCN633jCn',
    }
    const iouIssue = Issue.from(iouJson)
    expect(iouIssue.toJSON()).toEqual(iouJson)
  })

  it(`test from value mpt`, () => {
    const mptJson = {
      mpt_issuance_id: 'BAADF00DBAADF00DBAADF00DBAADF00DBAADF00DBAADF00D',
    }
    const mptIssue = Issue.from(mptJson)
    expect(mptIssue.toJSON()).toEqual(mptJson)
  })

  it(`test from parser xrp`, () => {
    const xrpJson = { currency: 'XRP' }
    const xrpIssue = Issue.from(xrpJson)
    const parser = new BinaryParser(xrpIssue.toHex())
    const parserIssue = Issue.fromParser(parser)
    expect(parserIssue.toJSON()).toEqual(xrpJson)
  })

  it(`test from parser issued currency`, () => {
    const iouJson = {
      currency: 'EUR',
      issuer: 'rLUEXYuLiQptky37CqLcm9USQpPiz5rkpD',
    }
    const iouIssue = Issue.from(iouJson)
    const parser = new BinaryParser(iouIssue.toHex())
    const parserIssue = Issue.fromParser(parser)
    expect(parserIssue.toJSON()).toEqual(iouJson)
  })

  it(`test from parser non-standard currency`, () => {
    const iouJson = {
      currency: '0123456789ABCDEF0123456789ABCDEF01234567',
      issuer: 'rLUEXYuLiQptky37CqLcm9USQpPiz5rkpD',
    }
    const iouIssue = Issue.from(iouJson)
    const parser = new BinaryParser(iouIssue.toHex())
    const parserIssue = Issue.fromParser(parser)
    expect(parserIssue.toJSON()).toEqual(iouJson)
  })

  it(`test from parser mpt`, () => {
    const mptJson = {
      mpt_issuance_id: 'BAADF00DBAADF00DBAADF00DBAADF00DBAADF00DBAADF00D',
    }
    const mptIssue = Issue.from(mptJson)
    const parser = new BinaryParser(mptIssue.toHex())
    const parserIssue = Issue.fromParser(parser, 24)
    expect(parserIssue.toJSON()).toEqual(mptJson)
  })

  it(`throws with invalid input`, () => {
    const invalidJson = { random: 123 }
    expect(() => {
      // @ts-expect-error -- need to test error message
      Issue.from(invalidJson)
    }).toThrow(new Error('Invalid type to construct an Amount'))
  })
})
