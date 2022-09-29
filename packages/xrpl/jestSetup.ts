import { TextEncoder, TextDecoder } from 'util'
global.TextEncoder = TextEncoder
// @ts-expect-error Ignore
global.TextDecoder = TextDecoder
