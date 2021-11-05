/*
 * Original code based on "backo" - https://github.com/segmentio/backo
 * MIT License - Copyright 2014 Segment.io
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation
 * files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy,
 * modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software
 * is furnished to do so, subject to the following conditions:
 * The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE
 * WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
 * COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE,
 * ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

interface ExponentialBackoffOptions {
  // The min backoff duration.
  min?: number
  // The max backoff duration.
  max?: number
}

const DEFAULT_MIN = 100
const DEFAULT_MAX = 1000

/**
 * A Back off strategy that increases exponentially. Useful with repeated
 * setTimeout calls over a network (where the destination may be down).
 */
export default class ExponentialBackoff {
  private readonly ms: number
  private readonly max: number
  private readonly factor: number = 2
  private numAttempts = 0

  /**
   * Constructs an ExponentialBackoff object.
   *
   * @param opts - The options for the object.
   */
  public constructor(opts: ExponentialBackoffOptions = {}) {
    this.ms = opts.min ?? DEFAULT_MIN
    this.max = opts.max ?? DEFAULT_MAX
  }

  /**
   * Number of attempts for backoff so far.
   *
   * @returns Number of attempts.
   */
  public get attempts(): number {
    return this.numAttempts
  }

  /**
   * Return the backoff duration.
   *
   * @returns The backoff duration in milliseconds.
   */
  public duration(): number {
    const ms = this.ms * this.factor ** this.numAttempts
    this.numAttempts += 1
    return Math.floor(Math.min(ms, this.max))
  }

  /**
   * Reset the number of attempts.
   */
  public reset(): void {
    this.numAttempts = 0
  }
}
