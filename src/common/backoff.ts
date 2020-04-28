/*
 * Original code based on "backo" - https://github.com/segmentio/backo
 * MIT License - Copyright 2014 Segment.io
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
 * The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

/**
 * A Back off strategy that increases exponentially. Useful with repeated
 * setTimeout calls over a network (where the destination may be down).
 */
export class ExponentialBackoff {
  private readonly ms: number
  private readonly max: number
  private readonly factor: number = 2
  private readonly jitter: number = 0
  attempts: number = 0

  constructor(opts: {min?: number; max?: number} = {}) {
    this.ms = opts.min || 100
    this.max = opts.max || 10000
  }

  /**
   * Return the backoff duration.
   */
  duration() {
    var ms = this.ms * Math.pow(this.factor, this.attempts++)
    if (this.jitter) {
      var rand = Math.random()
      var deviation = Math.floor(rand * this.jitter * ms)
      ms = (Math.floor(rand * 10) & 1) == 0 ? ms - deviation : ms + deviation
    }
    return Math.min(ms, this.max) | 0
  }

  /**
   * Reset the number of attempts.
   */
  reset() {
    this.attempts = 0
  }
}
