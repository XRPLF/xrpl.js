import { randomBytes as rand } from '@noble/hashes/utils'
// import rand from 'brorand' // TODO

export default function randomBytes(n: number) {
  return rand(n)
}
