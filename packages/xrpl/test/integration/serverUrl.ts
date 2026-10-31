/* eslint-disable n/no-process-env -- needed to find standalone connection */
const HOST = process.env.HOST ?? '0.0.0.0'
const PORT = process.env.PORT ?? '6006'
const serverUrl = `ws://${HOST}:${PORT}`
// Whether the live alphanet smoke test runs
export const ALPHANET = process.env.ALPHANET === '1'

export default serverUrl
