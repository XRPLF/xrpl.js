import { Algorithm, SigningMethod } from '../types'
import secp256k1 from './secp256k1'
import ed25519 from './ed25519'

export default function getSigningMethod(algorithm: Algorithm): SigningMethod {
  const methods = { 'ecdsa-secp256k1': secp256k1, ed25519 }
  return methods[algorithm]
}
