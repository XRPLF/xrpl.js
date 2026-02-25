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

  it(`PathSet: Two paths inside a PathSet`, () => {
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

  it(`PathSet: One path with one MPT hop`, () => {
    const mptIssuanceId = '00000001B5F762798A53D543A014CAF8B297CFF8F2F937E8'
    const path = [[{ mpt_issuance_id: mptIssuanceId } as HopObject]]

    const serializedHexRepr = coreTypes.PathSet.from(path).toHex().toUpperCase()
    expect(serializedHexRepr).toEqual(
      '40' /* MPT has a type code of 40 */ +
        mptIssuanceId.toUpperCase() /* raw 24-byte MPTID */ +
        '00' /* PathSet elements end with 00 code */,
    )
    expect(coreTypes.PathSet.from(path).toJSON()).toEqual(path)

    // validate the de-serialization via the BinaryParser
    const parser = new BinaryParser(serializedHexRepr)
    expect(coreTypes.PathSet.fromParser(parser)).toEqual(
      coreTypes.PathSet.from(path),
    )
  })

  it(`Two paths with mpt_issaunce_id hops`, () => {
    const mptIssuanceId1 = '00000001B5F762798A53D543A014CAF8B297CFF8F2F937E8'
    const mptIssuanceId2 = '000004C463C52827307480341125DA0577DEFC38405B0E3E'
    const path = [
      [{ mpt_issuance_id: mptIssuanceId1 } as HopObject],
      [{ mpt_issuance_id: mptIssuanceId2 } as HopObject],
    ]
    const serializedHexRepr = coreTypes.PathSet.from(path).toHex().toUpperCase()

    expect(serializedHexRepr).toEqual(
      '40' /* MPT has a type code of 40 */ +
        mptIssuanceId1.toUpperCase() /* raw 24-byte MPTID */ +
        'FF' /* Two path elements are separated by 0xFF type code */ +
        '40' /* MPT has a type code of 40 */ +
        mptIssuanceId2.toUpperCase() /* raw 24-byte MPTID */ +
        '00' /* PathSet elements end with 00 code */,
    )

    expect(coreTypes.PathSet.from(path).toJSON()).toEqual(path)

    // validate the de-serialization via the BinaryParser
    const parser = new BinaryParser(serializedHexRepr)
    expect(coreTypes.PathSet.fromParser(parser)).toEqual(
      coreTypes.PathSet.from(path),
    )
  })

  it(`Path with mpt_issuance_id and Currency PathElements`, () => {
    const mptIssuanceId = '00000001B5F762798A53D543A014CAF8B297CFF8F2F937E8'
    const currencyCode = 'ABC'
    const path = [
      [
        { mpt_issuance_id: mptIssuanceId } as HopObject,
        { currency: currencyCode } as HopObject,
      ],
    ]
    const serializedHexRepr = coreTypes.PathSet.from(path).toHex().toUpperCase()

    expect(serializedHexRepr).toEqual(
      '40' /* MPT has a type code of 40 */ +
        mptIssuanceId.toUpperCase() /* raw 24-byte MPTID */ +
        '10' /* Currency has a type code of 0x10 */ +
        Currency.from(currencyCode)
          .toHex()
          .toUpperCase() /* serialized repr of Currency type */ +
        '00' /* PathSet elements end with 00 code */,
    )

    // test the round-trip equivalence
    expect(coreTypes.PathSet.from(path).toJSON()).toEqual(path)

    // validate the de-serialization via the BinaryParser
    const parser = new BinaryParser(serializedHexRepr)
    expect(coreTypes.PathSet.fromParser(parser)).toEqual(
      coreTypes.PathSet.from(path),
    )
  })

  it(`Path with mpt_issuance_id and issuer PathElements`, () => {
    const mptIssuanceId = '00000001B5F762798A53D543A014CAF8B297CFF8F2F937E8'
    const issuerAccount = 'rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh'
    const path = [
      [
        { mpt_issuance_id: mptIssuanceId } as HopObject,
        { issuer: issuerAccount } as HopObject,
      ],
    ]
    const serializedHexRepr = coreTypes.PathSet.from(path).toHex().toUpperCase()

    expect(serializedHexRepr).toEqual(
      '40' /* MPT has a type code of 40 */ +
        mptIssuanceId.toUpperCase() /* raw 24-byte MPTID */ +
        '20' /* Issuer has a type code of 20 */ +
        AccountID.from(issuerAccount)
          .toHex()
          .toUpperCase() /* 20-byte issuer */ +
        '00' /* PathSet elements end with 00 code */,
    )

    // test the round-trip equivalence
    expect(coreTypes.PathSet.from(path).toJSON()).toEqual(path)

    // validate the de-serialization via the BinaryParser
    const parser = new BinaryParser(serializedHexRepr)
    expect(coreTypes.PathSet.fromParser(parser)).toEqual(
      coreTypes.PathSet.from(path),
    )
  })

  it(`PathSet: Currency and MPT are mutually exclusive in a hop`, () => {
    const currencyCode = 'ABC'
    const mptIssuanceId = '00000001B5F762798A53D543A014CAF8B297CFF8F2F937E8'

    const path = [
      [
        {
          currency: currencyCode,
          mpt_issuance_id: mptIssuanceId,
        } as HopObject,
      ],
    ]

    expect(() => coreTypes.PathSet.from(path)).toThrow(
      'Currency and mpt_issuance_id are mutually exclusive in a path hop',
    )
  })

  it(`PathSet: Deserialization rejects a hop with both Currency and MPT flags`, () => {
    // Type byte 0x50 = TYPE_CURRENCY (0x10) | TYPE_MPT (0x40)
    const invalidHex =
      '50' +
      Currency.from('ABC').toHex().toUpperCase() +
      '00000001B5F762798A53D543A014CAF8B297CFF8F2F937E8' +
      '00'

    const parser = new BinaryParser(invalidHex)
    expect(() => coreTypes.PathSet.fromParser(parser)).toThrow(
      'Currency and mpt_issuance_id are mutually exclusive',
    )
  })
})
