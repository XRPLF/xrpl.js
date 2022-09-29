import { assert } from 'chai'
import {
  rippleTimeToISOTime,
  isoTimeToRippleTime,
  unixTimeToRippleTime,
  rippleTimeToUnixTime,
} from 'xrpl-local'

describe('time conversion', () => {
  describe('rippleTimeToISOTime', () => {
    it('converts ripple time to ISO time', () => {
      const rippleTime = 0
      const isoTime = '2000-01-01T00:00:00.000Z'
      assert.equal(rippleTimeToISOTime(rippleTime), isoTime)
    })
  })

  describe('isoTimeToRippleTime', () => {
    it('converts ISO time to ripple time', () => {
      const rippleTime = 0
      const isoTime = '2000-01-01T00:00:00.000Z'
      assert.equal(isoTimeToRippleTime(isoTime), rippleTime)
    })

    it('converts from Date', () => {
      const rippleTime = 0
      const isoTime = '2000-01-01T00:00:00.000Z'
      assert.equal(isoTimeToRippleTime(new Date(isoTime)), rippleTime)
    })
  })

  describe('unixTimeToRippleTime', () => {
    it('converts unix time to ripple time', () => {
      const unixTime = 946684801000
      const rippleTime = 1
      assert.equal(unixTimeToRippleTime(unixTime), rippleTime)
    })
  })

  describe('rippleTimeToUnixTime', () => {
    it('converts ripple time to unix time', () => {
      const unixTime = 946684801000
      const rippleTime = 1
      assert.equal(rippleTimeToUnixTime(rippleTime), unixTime)
    })
  })
})
