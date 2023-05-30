import { isEarlierRippledVersion } from '../../src'

describe('isEarlierRippledVersion', function () {
  it('isEarlierRippledVersion compare versions correctly', () => {
    expect(isEarlierRippledVersion('1.9.4', '1.9.4')).toEqual(false)
    expect(isEarlierRippledVersion('0.9.2', '1.8.4')).toEqual(true)
    expect(isEarlierRippledVersion('1.8.2', '1.9.4')).toEqual(true)
    expect(isEarlierRippledVersion('1.9.2', '1.9.4')).toEqual(true)
    expect(isEarlierRippledVersion('1.9.2', '1.9.2-b1')).toEqual(false)
    expect(isEarlierRippledVersion('1.9.2', '1.9.2-rc2')).toEqual(false)
    expect(isEarlierRippledVersion('1.9.4-b2', '1.9.4-rc1')).toEqual(true)
    expect(isEarlierRippledVersion('1.9.4-b1', '1.9.4-b2')).toEqual(true)
    expect(isEarlierRippledVersion('1.9.4-rc1', '1.9.4-rc2')).toEqual(true)
    expect(isEarlierRippledVersion('1.6.2', '0.9.4')).toEqual(false)
    expect(isEarlierRippledVersion('1.9.4', '1.8.6')).toEqual(false)
    expect(isEarlierRippledVersion('1.9.4', '1.9.2-rc5')).toEqual(false)
    expect(isEarlierRippledVersion('1.8.0-rc1', '1.8.0')).toEqual(true)
    expect(isEarlierRippledVersion('1.9.4-rc1', '1.9.4-b3')).toEqual(false)
    expect(isEarlierRippledVersion('1.9.4-b2', '1.9.4-b1')).toEqual(false)
    expect(isEarlierRippledVersion('1.9.4-rc2', '1.9.4-rc1')).toEqual(false)
  })
})
