const { quality } = require('../dist/coretypes')

describe('Quality encode/decode', function () {
  const bookDirectory =
    '4627DFFCFF8B5A265EDBD8AE8C14A52325DBFEDAF4F5C32E5D06F4C3362FE1D0'
  const expectedQuality = '195796912.5171664'
  test('can decode', function () {
    const decimal = quality.decode(bookDirectory)
    expect(decimal.toString()).toBe(expectedQuality)
  })
  test('can encode', function () {
    const bytes = quality.encode(expectedQuality)
    expect(bytes.toString('hex').toUpperCase()).toBe(bookDirectory.slice(-16))
  })
})
