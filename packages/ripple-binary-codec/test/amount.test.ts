import { coreTypes } from '../src/types'
import fixtures from './fixtures/data-driven-tests.json'

import { makeParser } from '../src/binary'
const { Amount } = coreTypes

function amountErrorTests() {
  fixtures.values_tests
    .filter((obj) => obj.type === 'Amount')
    .forEach((f) => {
      // We only want these with errors
      if (!f.error) {
        return
      }
      const testName =
        `${JSON.stringify(f.test_json)}\n\tis invalid ` + `because: ${f.error}`
      it(testName, () => {
        expect(() => {
          Amount.from(f.test_json)
          JSON.stringify(f.test_json)
        }).toThrow()
      })
    })
}

describe('Amount', function () {
  it('can be parsed from', function () {
    expect(Amount.from('1000000') instanceof Amount).toBe(true)
    expect(Amount.from('1000000').toJSON()).toEqual('1000000')

    // it not valid to have negative XRP. But we test it anyways
    // to ensure logic correctness for toJSON of the Amount class
    {
      const parser = makeParser('0000000000000001')
      const value = parser.readType(Amount)
      const json = value.toJSON()
      expect(json).toEqual('-1')
    }

    const fixture = {
      value: '1',
      issuer: '0000000000000000000000000000000000000000',
      currency: 'USD',
    }
    const amt = Amount.from(fixture)
    const rewritten = {
      value: '1',
      issuer: 'rrrrrrrrrrrrrrrrrrrrrhoLvTp',
      currency: 'USD',
    }
    expect(amt.toJSON()).toEqual(rewritten)
  })

  it('can be parsed from MPT', function () {
    let fixture = {
      value: '100',
      mpt_issuance_id: '00002403C84A0A28E0190E208E982C352BBD5006600555CF',
    }
    let amt = Amount.from(fixture)
    expect(amt.toJSON()).toEqual(fixture)

    fixture = {
      value: '9223372036854775807',
      mpt_issuance_id: '00002403C84A0A28E0190E208E982C352BBD5006600555CF',
    }
    amt = Amount.from(fixture)
    expect(amt.toJSON()).toEqual(fixture)

    // it not valid to have negative MPT. But we test it anyways
    // to ensure logic correctness for toJSON of the Amount class
    {
      const parser = makeParser(
        '20000000000000006400002403C84A0A28E0190E208E982C352BBD5006600555CF',
      )
      const value = parser.readType(Amount)
      const json = value.toJSON()
      expect(json).toEqual({
        mpt_issuance_id: '00002403C84A0A28E0190E208E982C352BBD5006600555CF',
        value: '-100',
      })
    }
  })
  amountErrorTests()
})
