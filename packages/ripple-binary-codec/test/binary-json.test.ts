import fixtures from './fixtures/codec-fixtures.json'
import { decode, encode, decodeLedgerData } from '../src'

function json(object) {
  return JSON.stringify(object)
}

function truncateForDisplay(longStr) {
  return `${longStr.slice(0, 10)} ... ${longStr.slice(-10)}`
}

describe('ripple-binary-codec', function () {
  function makeSuite(name, entries) {
    describe(name, function () {
      entries.forEach((t, testN) => {
        it(`${name}[${testN}] can encode ${truncateForDisplay(
          json(t.json),
        )} to ${truncateForDisplay(t.binary)}`, () => {
          expect(encode(t.json)).toEqual(t.binary)
        })
        it(`${name}[${testN}] can decode ${truncateForDisplay(
          t.binary,
        )} to ${truncateForDisplay(json(t.json))}`, () => {
          const decoded = decode(t.binary)
          expect(decoded).toEqual(t.json)
        })
      })
    })
  }
  makeSuite('transactions', fixtures.transactions)
  makeSuite('accountState', fixtures.accountState)

  describe('ledgerData', function () {
    if (fixtures.ledgerData) {
      fixtures.ledgerData.forEach((t, testN) => {
        it(`ledgerData[${testN}] can decode ${t.binary} to ${json(
          t.json,
        )}`, () => {
          const decoded = decodeLedgerData(t.binary)
          expect(t.json).toEqual(decoded)
        })
      })
    }
  })
})
