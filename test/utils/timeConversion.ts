import { assert } from 'chai'

import {
  rippleTimeToISOTime,
  isoTimeToRippleTime,
  unixTimeToRippleTime,
  rippleTimeToUnixTime,
} from '../../src'

describe('time conversion', function () {
  describe('rippleTimeToISOTime', function () {
    it('converts ripple time to ISO time', function () {
      const rippleTime = 0
      const isoTime = '2000-01-01T00:00:00.000Z'
      assert.equal(rippleTimeToISOTime(rippleTime), isoTime)
    })
  })

  describe('isoTimeToRippleTime', function () {
    it('converts ISO time to ripple time', function () {
      const rippleTime = 0
      const isoTime = '2000-01-01T00:00:00.000Z'
      assert.equal(isoTimeToRippleTime(isoTime), rippleTime)
    })

    it('converts from Date', function () {
      const rippleTime = 0
      const isoTime = '2000-01-01T00:00:00.000Z'
      assert.equal(isoTimeToRippleTime(new Date(isoTime)), rippleTime)
    })
  })

  describe('unixTimeToRippleTime', function () {
    it('converts unix time to ripple time', function () {
      const unixTime = 946684801000
      const rippleTime = 1
      assert.equal(unixTimeToRippleTime(unixTime), rippleTime)
    })
  })

  describe('rippleTimeToUnixTime', function () {
    it('converts ripple time to unix time', function () {
      const unixTime = 946684801000
      const rippleTime = 1
      assert.equal(rippleTimeToUnixTime(rippleTime), unixTime)
    })
  })
})
