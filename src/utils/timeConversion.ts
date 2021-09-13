const RIPPLE_EPOCH_DIFF = 0x386d4380

/**
 * Convert a ripple timestamp to a unix timestamp.
 *
 * @param rpepoch - (seconds since 1/1/2000 GMT).
 * @returns Milliseconds since unix epoch.
 */
function rippleToUnixTimestamp(rpepoch: number): number {
  return (rpepoch + RIPPLE_EPOCH_DIFF) * 1000
}

/**
 * Convert a unix timestamp to a ripple timestamp.
 *
 * @param timestamp - (ms since unix epoch).
 * @returns Seconds since Ripple Epoch (1/1/2000 GMT).
 */
function unixToRippleTimestamp(timestamp: number): number {
  return Math.round(timestamp / 1000) - RIPPLE_EPOCH_DIFF
}

/**
 * Convert a ripple timestamp to an Iso8601 timestamp.
 *
 * @param rippleTime - Is the number of seconds since Ripple Epoch (1/1/2000 GMT).
 * @returns Iso8601 international standard date format.
 */
function rippleTimeToISOTime(rippleTime: number): string {
  return new Date(rippleToUnixTimestamp(rippleTime)).toISOString()
}

/**
 * Convert an Iso8601 timestmap to a ripple timestamp.
 *
 * @param iso8601 - International standard date format.
 * @returns Seconds since ripple epoch (1/1/2000 GMT).
 */
function ISOTimeToRippleTime(iso8601: string): number {
  return unixToRippleTimestamp(Date.parse(iso8601))
}

export { rippleTimeToISOTime, ISOTimeToRippleTime }
