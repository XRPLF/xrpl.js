const {seqEqual, concatArgs} = require('./utils')

test('two sequences are equal', () => {
  expect(seqEqual([1, 2, 3], [1, 2, 3])).toBe(true)
})

test('elements must be in the same order', () => {
  expect(seqEqual([3, 2, 1], [1, 2, 3])).toBe(false)
})

test('sequences do not need to be the same type', () => {
  expect(seqEqual(Buffer.from([1, 2, 3]), [1, 2, 3])).toBe(true)
  expect(seqEqual(Buffer.from([1, 2, 3]), new Uint8Array([1, 2, 3]))).toBe(true)
})

test('sequences with a single element', () => {
  expect(seqEqual(Buffer.from([1]), [1])).toBe(true)
  expect(seqEqual(Buffer.from([1]), new Uint8Array([1]))).toBe(true)
})

test('empty sequences', () => {
  expect(seqEqual(Buffer.from([]), [])).toBe(true)
  expect(seqEqual(Buffer.from([]), new Uint8Array([]))).toBe(true)
})

test('plain numbers are concatenated', () => {
  expect(concatArgs(10, 20, 30, 40)).toStrictEqual([10, 20, 30, 40])
})

test('a variety of values are concatenated', () => {
  expect(concatArgs(1, [2, 3], Buffer.from([4,5]), new Uint8Array([6, 7]))).toStrictEqual([1,2,3,4,5,6,7])
})

test('a single value is returned as an array', () => {
  expect(concatArgs(Buffer.from([7]))).toStrictEqual([7])
})

test('no arguments returns an empty array', () => {
  expect(concatArgs()).toStrictEqual([])
})
