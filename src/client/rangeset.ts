import * as _ from 'lodash'
import * as assert from 'assert'

type Interval = [number, number]

function mergeIntervals(intervals: Interval[]): Interval[] {
  const stack: Interval[] = [[-Infinity, -Infinity]]
  _.sortBy(intervals, (x) => x[0]).forEach((interval) => {
    const lastInterval: Interval = stack.pop()!
    if (interval[0] <= lastInterval[1] + 1) {
      stack.push([lastInterval[0], Math.max(interval[1], lastInterval[1])])
    } else {
      stack.push(lastInterval)
      stack.push(interval)
    }
  })
  return stack.slice(1)
}

class RangeSet {
  ranges: Array<[number, number]>

  constructor() {
    this.reset()
  }

  reset() {
    this.ranges = []
  }

  serialize() {
    return this.ranges
      .map((range) => range[0].toString() + '-' + range[1].toString())
      .join(',')
  }

  addRange(start: number, end: number) {
    assert.ok(start <= end, `invalid range ${start} <= ${end}`)
    this.ranges = mergeIntervals(this.ranges.concat([[start, end]]))
  }

  addValue(value: number) {
    this.addRange(value, value)
  }

  parseAndAddRanges(rangesString: string) {
    const rangeStrings = rangesString.split(',')
    rangeStrings.forEach((rangeString) => {
      const range = rangeString.split('-').map(Number)
      this.addRange(range[0], range.length === 1 ? range[0] : range[1])
    })
  }

  containsRange(start: number, end: number) {
    return this.ranges.some((range) => range[0] <= start && range[1] >= end)
  }

  containsValue(value: number) {
    return this.containsRange(value, value)
  }
}

export default RangeSet
