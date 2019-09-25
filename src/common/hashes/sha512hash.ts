import {createHash} from 'crypto'
export default (hex: string): string => {
  return createHash('sha512').update(Buffer.from(hex, 'hex')).digest('hex').toUpperCase().slice(0, 64)
}