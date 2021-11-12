const { coreTypes } = require('../dist/types')
const { SerializedType } = require('../dist/types/serialized-type')

describe('SerializedType interfaces', () => {
  Object.entries(coreTypes).forEach(([name, Value]) => {
    test(`${name} has a \`from\` static constructor`, () => {
      expect(Value.from && Value.from !== Array.from).toBe(true)
    })
    test(`${name} has a default constructor`, () => {
      expect(new Value()).not.toBe(undefined)
    })
    test(`${name}.from will return the same object`, () => {
      const instance = new Value()
      expect(Value.from(instance) === instance).toBe(true)
    })
    test(`${name} instances have toBytesSink`, () => {
      expect(new Value().toBytesSink).not.toBe(undefined)
    })
    test(`${name} instances have toJSON`, () => {
      expect(new Value().toJSON).not.toBe(undefined)
    })
    test(`${name}.from(json).toJSON() == json`, () => {
      const newJSON = new Value().toJSON()
      expect(Value.from(newJSON).toJSON()).toEqual(newJSON)
    })
    describe(`${name} supports all methods of the SerializedType mixin`, () => {
      Object.keys(SerializedType.prototype).forEach((k) => {
        test(`new ${name}.prototype.${k} !== undefined`, () => {
          expect(Value.prototype[k]).not.toBe(undefined)
        })
      })
    })
  })
})
