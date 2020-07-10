const { coreTypes } = require('../dist/types')
const { UInt8, UInt64 } = coreTypes

test('compareToTests', () => {
  expect(UInt8.from(124).compareTo(UInt64.from(124))).toBe(0)
})

test('compareToTest', () => {
  expect(UInt64.from(124).compareTo(UInt8.from(124))).toBe(0)
})

test('compareToTest', () => {
  expect(UInt64.from(124).compareTo(UInt8.from(123))).toBe(1)
})

test('compareToTest', () => {
  expect(UInt8.from(124).compareTo(UInt8.from(13))).toBe(1)
})

test('compareToTest', () => {
  expect(UInt8.from(124).compareTo(124)).toBe(0)
})

test('compareToTest', () => {
  expect(UInt64.from(124).compareTo(124)).toBe(0)
})

test('compareToTest', () => {
  expect(UInt64.from(124).compareTo(123)).toBe(1)
})

test('compareToTest', () => {
  expect(UInt8.from(124).compareTo(13)).toBe(1)
})

test('valueOfTests', () => {
  let val = UInt8.from(1)
  val |= 0x2
  expect(val).toBe(3)
})
