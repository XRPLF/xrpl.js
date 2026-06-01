/* eslint-disable max-params -- context-hash builders mirror the C ABI argument lists */
import {
  ACCOUNT_ID_SIZE,
  CONTEXT_HASH_SIZE,
  ISSUANCE_ID_SIZE,
} from './constants'
import { bytesToHex, hexToBytes } from './hex'
import { withModule } from './runtime'

/**
 * Context hash bound to a ConfidentialMPTConvert transaction.
 *
 * @param account - The 20-byte hex AccountID of the converting holder.
 * @param issuance - The 24-byte hex MPTokenIssuanceID.
 * @param sequence - The transaction sequence number.
 * @returns The 32-byte hex context hash.
 * @throws If inputs are malformed or the WASM call fails.
 */
export async function getConvertContextHash(
  account: string,
  issuance: string,
  sequence: number,
): Promise<string> {
  const acc = hexToBytes(account, 'account', ACCOUNT_ID_SIZE)
  const iss = hexToBytes(issuance, 'issuance', ISSUANCE_ID_SIZE)
  return withModule((mod, marshaller) => {
    const accPtr = marshaller.allocBytes(acc)
    const issPtr = marshaller.allocBytes(iss)
    const outPtr = marshaller.alloc(CONTEXT_HASH_SIZE)
    if (
      mod._mpt_get_convert_context_hash(accPtr, issPtr, sequence, outPtr) !== 0
    ) {
      throw new Error('mpt_get_convert_context_hash failed')
    }
    return bytesToHex(marshaller.readBytes(outPtr, CONTEXT_HASH_SIZE))
  })
}

/**
 * Context hash bound to a ConfidentialMPTConvertBack transaction.
 *
 * @param account - The 20-byte hex AccountID of the holder.
 * @param issuance - The 24-byte hex MPTokenIssuanceID.
 * @param sequence - The transaction sequence number.
 * @param version - The confidential balance version.
 * @returns The 32-byte hex context hash.
 * @throws If inputs are malformed or the WASM call fails.
 */
export async function getConvertBackContextHash(
  account: string,
  issuance: string,
  sequence: number,
  version: number,
): Promise<string> {
  const acc = hexToBytes(account, 'account', ACCOUNT_ID_SIZE)
  const iss = hexToBytes(issuance, 'issuance', ISSUANCE_ID_SIZE)
  return withModule((mod, marshaller) => {
    const accPtr = marshaller.allocBytes(acc)
    const issPtr = marshaller.allocBytes(iss)
    const outPtr = marshaller.alloc(CONTEXT_HASH_SIZE)
    if (
      mod._mpt_get_convert_back_context_hash(
        accPtr,
        issPtr,
        sequence,
        version,
        outPtr,
      ) !== 0
    ) {
      throw new Error('mpt_get_convert_back_context_hash failed')
    }
    return bytesToHex(marshaller.readBytes(outPtr, CONTEXT_HASH_SIZE))
  })
}

/**
 * Context hash bound to a ConfidentialMPTSend transaction.
 *
 * @param account - The 20-byte hex AccountID of the sender.
 * @param issuance - The 24-byte hex MPTokenIssuanceID.
 * @param sequence - The transaction sequence number.
 * @param destination - The 20-byte hex AccountID of the destination.
 * @param version - The confidential balance version.
 * @returns The 32-byte hex context hash.
 * @throws If inputs are malformed or the WASM call fails.
 */
export async function getSendContextHash(
  account: string,
  issuance: string,
  sequence: number,
  destination: string,
  version: number,
): Promise<string> {
  const acc = hexToBytes(account, 'account', ACCOUNT_ID_SIZE)
  const iss = hexToBytes(issuance, 'issuance', ISSUANCE_ID_SIZE)
  const dest = hexToBytes(destination, 'destination', ACCOUNT_ID_SIZE)
  return withModule((mod, marshaller) => {
    const accPtr = marshaller.allocBytes(acc)
    const issPtr = marshaller.allocBytes(iss)
    const destPtr = marshaller.allocBytes(dest)
    const outPtr = marshaller.alloc(CONTEXT_HASH_SIZE)
    if (
      mod._mpt_get_send_context_hash(
        accPtr,
        issPtr,
        sequence,
        destPtr,
        version,
        outPtr,
      ) !== 0
    ) {
      throw new Error('mpt_get_send_context_hash failed')
    }
    return bytesToHex(marshaller.readBytes(outPtr, CONTEXT_HASH_SIZE))
  })
}

/**
 * Context hash bound to a ConfidentialMPTClawback transaction.
 *
 * @param account - The 20-byte hex AccountID of the issuer.
 * @param issuance - The 24-byte hex MPTokenIssuanceID.
 * @param sequence - The transaction sequence number.
 * @param holder - The 20-byte hex AccountID of the holder being clawed back.
 * @returns The 32-byte hex context hash.
 * @throws If inputs are malformed or the WASM call fails.
 */
export async function getClawbackContextHash(
  account: string,
  issuance: string,
  sequence: number,
  holder: string,
): Promise<string> {
  const acc = hexToBytes(account, 'account', ACCOUNT_ID_SIZE)
  const iss = hexToBytes(issuance, 'issuance', ISSUANCE_ID_SIZE)
  const hold = hexToBytes(holder, 'holder', ACCOUNT_ID_SIZE)
  return withModule((mod, marshaller) => {
    const accPtr = marshaller.allocBytes(acc)
    const issPtr = marshaller.allocBytes(iss)
    const holdPtr = marshaller.allocBytes(hold)
    const outPtr = marshaller.alloc(CONTEXT_HASH_SIZE)
    if (
      mod._mpt_get_clawback_context_hash(
        accPtr,
        issPtr,
        sequence,
        holdPtr,
        outPtr,
      ) !== 0
    ) {
      throw new Error('mpt_get_clawback_context_hash failed')
    }
    return bytesToHex(marshaller.readBytes(outPtr, CONTEXT_HASH_SIZE))
  })
}
