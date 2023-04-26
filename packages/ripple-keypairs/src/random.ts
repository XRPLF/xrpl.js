import { randomBytes as rand } from '@noble/hashes/utils'

export default function randomBytes(n: number) {
  return rand(n)
}
