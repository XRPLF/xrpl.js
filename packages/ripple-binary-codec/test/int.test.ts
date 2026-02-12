import { Int32 } from '../src/types'
import { encode, decode } from '../src'

describe('Int32', () => {
  describe('from()', () => {
    it('should create Int32 from positive number', () => {
      const int32 = Int32.from(12345)
      expect(int32.valueOf()).toBe(12345)
    })

    it('should create Int32 from negative number', () => {
      const int32 = Int32.from(-12345)
      expect(int32.valueOf()).toBe(-12345)
    })

    it('should create Int32 from zero', () => {
      const int32 = Int32.from(0)
      expect(int32.valueOf()).toBe(0)
    })

    it('should create Int32 from positive string', () => {
      const int32 = Int32.from('67890')
      expect(int32.valueOf()).toBe(67890)
    })

    it('should create Int32 from negative string', () => {
      const int32 = Int32.from('-67890')
      expect(int32.valueOf()).toBe(-67890)
    })

    it('should create Int32 from another Int32', () => {
      const original = Int32.from(999)
      const copy = Int32.from(original)
      expect(copy.valueOf()).toBe(999)
    })

    it('should handle MIN_VALUE', () => {
      const int32 = Int32.from(-2147483648)
      expect(int32.valueOf()).toBe(-2147483648)
    })

    it('should handle MAX_VALUE', () => {
      const int32 = Int32.from(2147483647)
      expect(int32.valueOf()).toBe(2147483647)
    })
  })

  describe('range validation', () => {
    it('should throw error when value exceeds MAX_VALUE', () => {
      expect(() => Int32.from(2147483648)).toThrow(
        '2147483648 must be >= -2147483648 and <= 2147483647',
      )
    })

    it('should throw error when value is below MIN_VALUE', () => {
      expect(() => Int32.from(-2147483649)).toThrow(
        '-2147483649 must be >= -2147483648 and <= 2147483647',
      )
    })

    it('should throw error for string exceeding MAX_VALUE', () => {
      expect(() => Int32.from('2147483648')).toThrow(
        '2147483648 must be >= -2147483648 and <= 2147483647',
      )
    })

    it('should throw error for string below MIN_VALUE', () => {
      expect(() => Int32.from('-2147483649')).toThrow(
        '-2147483649 must be >= -2147483648 and <= 2147483647',
      )
    })
  })

  describe('decimal validation', () => {
    it('should throw error when passed a decimal number', () => {
      expect(() => Int32.from(100.5)).toThrow(
        'Cannot construct Int32 from given value',
      )
    })

    it('should throw error when passed a negative decimal', () => {
      expect(() => Int32.from(-100.5)).toThrow(
        'Cannot construct Int32 from given value',
      )
    })

    it('should throw error when passed a small decimal', () => {
      expect(() => Int32.from(0.001)).toThrow(
        'Cannot construct Int32 from given value',
      )
    })

    it('should throw error for non-numeric string', () => {
      expect(() => Int32.from('abc')).toThrow(
        'Cannot construct Int32 from string: abc',
      )
    })
  })

  describe('compareTo()', () => {
    it('should return 0 for equal values', () => {
      expect(Int32.from(100).compareTo(Int32.from(100))).toBe(0)
    })

    it('should return 1 when first value is greater', () => {
      expect(Int32.from(100).compareTo(Int32.from(50))).toBe(1)
    })

    it('should return -1 when first value is smaller', () => {
      expect(Int32.from(50).compareTo(Int32.from(100))).toBe(-1)
    })

    it('should compare with raw number', () => {
      expect(Int32.from(100).compareTo(100)).toBe(0)
      expect(Int32.from(100).compareTo(50)).toBe(1)
      expect(Int32.from(50).compareTo(100)).toBe(-1)
    })

    it('should handle negative values', () => {
      expect(Int32.from(-100).compareTo(Int32.from(-50))).toBe(-1)
      expect(Int32.from(-50).compareTo(Int32.from(-100))).toBe(1)
      expect(Int32.from(-100).compareTo(Int32.from(-100))).toBe(0)
    })

    it('should compare negative and positive values', () => {
      expect(Int32.from(-100).compareTo(Int32.from(100))).toBe(-1)
      expect(Int32.from(100).compareTo(Int32.from(-100))).toBe(1)
    })
  })

  describe('toJSON()', () => {
    it('should return number for positive value', () => {
      expect(Int32.from(12345).toJSON()).toBe(12345)
    })

    it('should return number for negative value', () => {
      expect(Int32.from(-12345).toJSON()).toBe(-12345)
    })

    it('should return 0 for zero', () => {
      expect(Int32.from(0).toJSON()).toBe(0)
    })
  })

  describe('valueOf()', () => {
    it('should allow bitwise operations', () => {
      const val = Int32.from(5)
      expect(val.valueOf() | 0x2).toBe(7)
    })

    it('should handle negative values in bitwise operations', () => {
      const val = Int32.from(-1)
      expect(val.valueOf() & 0xff).toBe(255)
    })
  })

  describe('encode/decode with Loan ledger entry', () => {
    // Loan object from Devnet with LoanScale field
    const loanWithScale = {
      Borrower: 'rs5fUokF7Y5bxNkstM4p4JYHgqzYkFamCg',
      GracePeriod: 60,
      LoanBrokerID:
        '18F91BD8009DAF09B5E4663BE7A395F5F193D0657B12F8D1E781EB3D449E8151',
      LoanScale: -11,
      LoanSequence: 1,
      NextPaymentDueDate: 822779431,
      PaymentInterval: 400,
      PaymentRemaining: 1,
      PeriodicPayment: '10000',
      PrincipalOutstanding: '10000',
      StartDate: 822779031,
      TotalValueOutstanding: '10000',
      LedgerEntryType: 'Loan',
    }

    it('can encode and decode Loan with negative LoanScale', () => {
      const encoded = encode(loanWithScale)
      const decoded = decode(encoded)
      console.log(decoded)
      expect(decoded).toEqual(loanWithScale)
    })

    it('can encode and decode Loan with positive LoanScale', () => {
      const loan = { ...loanWithScale, LoanScale: 5 }
      const encoded = encode(loan)
      const decoded = decode(encoded)
      expect(decoded).toEqual(loan)
    })
  })
})
