import { groupBy, omitBy } from '../../src/utils/collections'

describe('Collection Utils:', () => {
  // Inspired from tests at https://github.com/lodash/lodash/blob/main/test/groupBy.spec.js
  describe('groupBy', () => {
    const array = [6.1, 4.2, 6.3]

    it('should transform keys by `iteratee`', () => {
      const actual = groupBy(array, Math.floor)
      expect(actual).toEqual({ 4: [4.2], 6: [6.1, 6.3] })
    })

    it('should transform keys by `iteratee` that returns strings', () => {
      const actual = groupBy(array, (item) => Math.floor(item).toString())
      expect(actual).toEqual({ '4': [4.2], '6': [6.1, 6.3] })
    })
  })

  // Taken from https://github.com/lodash/lodash/blob/main/test/omitBy.spec.js
  describe('omitBy', () => {
    it('should work with a predicate argument', () => {
      const object = { a: 1, b: 2, c: 3, d: 4 }

      const actual = omitBy(object, (n) => n != 2 && n != 4)

      expect(actual).toEqual({ b: 2, d: 4 })
    })
  })
})
