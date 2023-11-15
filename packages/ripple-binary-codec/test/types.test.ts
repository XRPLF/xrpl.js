import { SerializedType } from '../src/types/serialized-type'
import { coreTypes } from '../src/types'

describe('SerializedType implementations', () => {
  Object.entries(coreTypes).forEach(([name, Value]) => {
    it(`${name} has a \`from\` static constructor`, () => {
      expect(Value.from).toBeDefined()
      expect(Value.from).not.toEqual(Array.from)
    })
    it(`${name} has a default constructor`, () => {
      expect(new Value()).not.toBe(undefined)
    })
    it(`${name}.from will return the same object`, () => {
      const instance = new Value()
      expect(Value.from(instance) === instance).toBe(true)
    })
    it(`${name} instances have toBytesSink`, () => {
      expect(new Value().toBytesSink).not.toBe(undefined)
    })
    it(`${name} instances have toJSON`, () => {
      expect(new Value().toJSON).not.toBe(undefined)
    })
    it(`${name}.from(json).toJSON() == json`, () => {
      const newJSON = new Value().toJSON()
      expect(Value.from(newJSON).toJSON()).toEqual(newJSON)
    })
    it(`${name} extends SerializedType mixin`, () => {
      const obj = new Value()
      expect(obj).toBeInstanceOf(SerializedType)
    })
  })
})
