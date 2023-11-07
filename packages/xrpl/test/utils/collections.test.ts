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
      const object = { aa: 1, bb: 2, cc: 3, dd: 4 }
      const actual = omitBy(object, (num) => num !== 2 && num !== 4)
      expect(actual).toEqual({ bb: 2, dd: 4 })
    })
  })
})
