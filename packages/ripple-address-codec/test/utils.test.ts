import { seqEqual, concatArgs } from '../src/utils'

it('two sequences are equal', () => {
  expect(seqEqual([1, 2, 3], [1, 2, 3])).toBe(true)
})

it('elements must be in the same order', () => {
  expect(seqEqual([3, 2, 1], [1, 2, 3])).toBe(false)
})

it('sequences do not need to be the same type', () => {
  expect(seqEqual(Buffer.from([1, 2, 3]), [1, 2, 3])).toBe(true)
  expect(seqEqual(Buffer.from([1, 2, 3]), new Uint8Array([1, 2, 3]))).toBe(true)
})

it('sequences with a single element', () => {
  expect(seqEqual(Buffer.from([1]), [1])).toBe(true)
  expect(seqEqual(Buffer.from([1]), new Uint8Array([1]))).toBe(true)
})

it('empty sequences', () => {
  expect(seqEqual(Buffer.from([]), [])).toBe(true)
  expect(seqEqual(Buffer.from([]), new Uint8Array([]))).toBe(true)
})

it('plain numbers are concatenated', () => {
  expect(concatArgs(10, 20, 30, 40)).toEqual([10, 20, 30, 40])
})

it('a variety of values are concatenated', () => {
  expect(
    concatArgs(1, [2, 3], Buffer.from([4, 5]), new Uint8Array([6, 7])),
  ).toEqual([1, 2, 3, 4, 5, 6, 7])
})

it('a single value is returned as an array', () => {
  expect(concatArgs(Buffer.from([7]))).toEqual([7])
})

it('no arguments returns an empty array', () => {
  expect(concatArgs()).toEqual([])
})
