import {createHash} from 'crypto'

const sha512Half = (hex: string): string => {
  return createHash('sha512')
    .update(Buffer.from(hex, 'hex'))
    .digest('hex')
    .toUpperCase()
    .slice(0, 64)
}

export default sha512Half
