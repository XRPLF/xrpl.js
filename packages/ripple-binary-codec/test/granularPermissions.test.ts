import { XrplDefinitions } from '../src'
import normalDefinitionsJson from '../src/enums/definitions.json'

describe('Granular Permissions', function () {
  describe('SponsorFee and SponsorReserve permissions', function () {
    it('should have SponsorFee defined with value 65549', function () {
      const definitions = new XrplDefinitions(normalDefinitionsJson)
      expect(definitions.granularPermissions.SponsorFee).toBe(65549)
    })

    it('should have SponsorReserve defined with value 65550', function () {
      const definitions = new XrplDefinitions(normalDefinitionsJson)
      expect(definitions.granularPermissions.SponsorReserve).toBe(65550)
    })

    it('should have all expected granular permissions defined', function () {
      const definitions = new XrplDefinitions(normalDefinitionsJson)

      // Verify all granular permissions are present
      const expectedPermissions = {
        TrustlineAuthorize: 65537,
        TrustlineFreeze: 65538,
        TrustlineUnfreeze: 65539,
        AccountDomainSet: 65540,
        AccountEmailHashSet: 65541,
        AccountMessageKeySet: 65542,
        AccountTransferRateSet: 65543,
        AccountTickSizeSet: 65544,
        PaymentMint: 65545,
        PaymentBurn: 65546,
        MPTokenIssuanceLock: 65547,
        MPTokenIssuanceUnlock: 65548,
        SponsorFee: 65549,
        SponsorReserve: 65550,
      }

      expect(definitions.granularPermissions).toEqual(expectedPermissions)
    })

    it('should have granular permissions with values greater than UINT16_MAX (65536)', function () {
      const definitions = new XrplDefinitions(normalDefinitionsJson)
      const UINT16_MAX = 65536

      // All granular permissions should have values > 65536
      Object.entries(definitions.granularPermissions).forEach(
        ([_name, value]) => {
          expect(value).toBeGreaterThan(UINT16_MAX)
        },
      )
    })

    it('should have SponsorFee and SponsorReserve as the highest permission values', function () {
      const definitions = new XrplDefinitions(normalDefinitionsJson)

      const allValues = Object.values(definitions.granularPermissions)
      const maxValue = Math.max(...allValues)

      // SponsorReserve should be the highest value
      expect(definitions.granularPermissions.SponsorReserve).toBe(maxValue)
      // SponsorFee should be second highest
      expect(definitions.granularPermissions.SponsorFee).toBe(maxValue - 1)
    })
  })

  /**
   * Edge cases and boundary conditions for granular permissions.
   * Per XLS-0068 Sections 13-14, granular permissions are values > UINT16_MAX (65536).
   */
  describe('Edge cases and boundary conditions', function () {
    it('should have exactly 14 granular permissions defined', function () {
      const definitions = new XrplDefinitions(normalDefinitionsJson)
      const permissionCount = Object.keys(
        definitions.granularPermissions,
      ).length

      expect(permissionCount).toBe(14)
    })

    it('should have no granular permissions with value <= UINT16_MAX', function () {
      const definitions = new XrplDefinitions(normalDefinitionsJson)
      const UINT16_MAX = 65536

      Object.entries(definitions.granularPermissions).forEach(
        ([_name, value]) => {
          expect(value).toBeGreaterThan(UINT16_MAX)
        },
      )
    })

    it('should have granular permissions starting at 65537 (UINT16_MAX + 1)', function () {
      const definitions = new XrplDefinitions(normalDefinitionsJson)
      const UINT16_MAX_PLUS_ONE = 65537

      const allValues = Object.values(definitions.granularPermissions)
      const minValue = Math.min(...allValues)

      expect(minValue).toBe(UINT16_MAX_PLUS_ONE)
    })

    it('should have SponsorFee value exactly one less than SponsorReserve', function () {
      const definitions = new XrplDefinitions(normalDefinitionsJson)

      const sponsorFee = definitions.granularPermissions.SponsorFee
      const sponsorReserve = definitions.granularPermissions.SponsorReserve

      expect(sponsorReserve - sponsorFee).toBe(1)
    })

    it('should have unique values for all granular permissions', function () {
      const definitions = new XrplDefinitions(normalDefinitionsJson)

      const allValues = Object.values(definitions.granularPermissions)
      const uniqueValues = new Set(allValues)

      expect(uniqueValues.size).toBe(allValues.length)
    })

    it('should have consecutive values for all granular permissions', function () {
      const definitions = new XrplDefinitions(normalDefinitionsJson)

      const allValues = Object.values(definitions.granularPermissions).sort(
        (a, b) => a - b,
      )

      for (let i = 1; i < allValues.length; i++) {
        expect(allValues[i] - allValues[i - 1]).toBe(1)
      }
    })

    it('should not allow undefined permission names to be accessed', function () {
      const definitions = new XrplDefinitions(normalDefinitionsJson)

      // Accessing an undefined permission should return undefined
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(
        (definitions.granularPermissions as any).NonExistentPermission,
      ).toBeUndefined()
    })
  })
})
