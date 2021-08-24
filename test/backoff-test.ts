import assert from 'assert-diff'
import {ExponentialBackoff} from '../src/client/backoff'

describe('ExponentialBackoff', function () {
  it('duration() return value starts with the min value', function () {
    // default: 100ms
    assert(new ExponentialBackoff().duration(), 100)
    assert(new ExponentialBackoff({min: 100}).duration(), 100)
    assert(new ExponentialBackoff({min: 123}).duration(), 123)
  })

  it('duration() return value increases when called multiple times', function () {
    const backoff = new ExponentialBackoff({min: 100, max: 1000})
    assert.strictEqual(backoff.duration(), 100)
    assert.strictEqual(backoff.duration(), 200)
    assert.strictEqual(backoff.duration(), 400)
    assert.strictEqual(backoff.duration(), 800)
  })

  it('duration() never returns greater than the max value', function () {
    const backoff = new ExponentialBackoff({min: 300, max: 1000})
    assert.strictEqual(backoff.duration(), 300)
    assert.strictEqual(backoff.duration(), 600)
    assert.strictEqual(backoff.duration(), 1000)
    assert.strictEqual(backoff.duration(), 1000)
  })

  it('reset() will reset the duration() value', function () {
    const backoff = new ExponentialBackoff({min: 100, max: 1000})
    assert.strictEqual(backoff.duration(), 100)
    assert.strictEqual(backoff.duration(), 200)
    assert.strictEqual(backoff.duration(), 400)
    backoff.reset()
    assert.strictEqual(backoff.duration(), 100)
    assert.strictEqual(backoff.duration(), 200)
  })
})
