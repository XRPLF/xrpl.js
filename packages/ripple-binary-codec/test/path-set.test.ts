import { BinaryParser } from '../src/binary'
import { coreTypes, HopObject, AccountID, Currency } from '../src/types'

describe('Path-Set binary-codec unit tests', () => {
  it(`PathSet: one path with one account hop`, () => {
    const genesisAccountID = 'rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh'
    const path = [[{ account: genesisAccountID } as HopObject]]

    const serializedHexRepr = coreTypes.PathSet.from(path).toHex().toUpperCase()
    expect(serializedHexRepr).toEqual(
      '01' /* Account has a type code of 01 */ +
        AccountID.from(genesisAccountID).toHex().toUpperCase() +
        '00' /* PathSet elements end with 00 code */,
    )
    expect(coreTypes.PathSet.from(path).toJSON()).toEqual(path)

    // validate the de-serialization via the BinaryParser
    const parser = new BinaryParser(serializedHexRepr)
    expect(coreTypes.PathSet.fromParser(parser)).toEqual(
      coreTypes.PathSet.from(path),
    )
  })

  it(`PathSet: One path with one Currency hop`, () => {
    const currencyCode = 'ABC'
    const path = [[{ currency: currencyCode } as HopObject]]

    const serializedHexRepr = coreTypes.PathSet.from(path).toHex().toUpperCase()
    expect(serializedHexRepr).toEqual(
      '10' /* Currency has a type code of 10 */ +
        Currency.from(currencyCode).toHex().toUpperCase() +
        '00' /* PathSet elements end with 00 code */,
    )
    expect(coreTypes.PathSet.from(path).toJSON()).toEqual(path)

    // validate the de-serialization via the BinaryParser
    const parser = new BinaryParser(serializedHexRepr)
    expect(coreTypes.PathSet.fromParser(parser)).toEqual(
      coreTypes.PathSet.from(path),
    )
  })

  it(`PathSet: One path with one Issuer hop`, () => {
    const issuerAccount = 'rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh'
    const path = [[{ issuer: issuerAccount } as HopObject]]
    const serializedHexRepr = coreTypes.PathSet.from(path).toHex().toUpperCase()

    expect(serializedHexRepr).toEqual(
      '20' /* Issuer has a type code of 20 */ +
        AccountID.from(issuerAccount).toHex().toUpperCase() +
        '00' /* PathSet elements end with 00 code */,
    )
    expect(coreTypes.PathSet.from(path).toJSON()).toEqual(path)

    // validate the de-serialization via the BinaryParser
    const parser = new BinaryParser(serializedHexRepr)
    expect(coreTypes.PathSet.fromParser(parser)).toEqual(
      coreTypes.PathSet.from(path),
    )
  })

  it(`PathSet: One path with Currency+Issuer hop`, () => {
    const issuerAccount = 'rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh'
    const currencyCode = 'ABC'
    const path = [
      [{ issuer: issuerAccount, currency: currencyCode } as HopObject],
    ]
    const serializedHexRepr = coreTypes.PathSet.from(path).toHex().toUpperCase()

    expect(serializedHexRepr).toEqual(
      '30' /* bitwise OR of the two appropriate type codes */ +
        Currency.from(currencyCode).toHex().toUpperCase() +
        AccountID.from(issuerAccount).toHex().toUpperCase() +
        '00' /* PathSet elements end with 00 code */,
    )
    expect(coreTypes.PathSet.from(path).toJSON()).toEqual(path)

    // validate the de-serialization via the BinaryParser
    const parser = new BinaryParser(serializedHexRepr)
    expect(coreTypes.PathSet.fromParser(parser)).toEqual(
      coreTypes.PathSet.from(path),
    )
  })

  it(`PathSet: Two hops inside a Path`, () => {
    const issuerAccount = 'rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh'
    const currencyCode = 'ABC'
    const path = [
      [{ issuer: issuerAccount } as HopObject],
      [{ currency: currencyCode } as HopObject],
    ]
    const serializedHexRepr = coreTypes.PathSet.from(path).toHex().toUpperCase()

    expect(serializedHexRepr).toEqual(
      '20' /* Issuer has a type code of 20 */ +
        AccountID.from(issuerAccount).toHex().toUpperCase() +
        'FF' /* Two path elements are seperated by 0xFF type code */ +
        '10' /* Currency has a type code of 10 */ +
        Currency.from(currencyCode).toHex().toUpperCase() +
        '00' /* PathSet elements end with 00 code */,
    )
    expect(coreTypes.PathSet.from(path).toJSON()).toEqual(path)

    // validate the de-serialization via the BinaryParser
    const parser = new BinaryParser(serializedHexRepr)
    expect(coreTypes.PathSet.fromParser(parser)).toEqual(
      coreTypes.PathSet.from(path),
    )
  })
})
