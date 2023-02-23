/**
 * @module tts
 * @description
 * This module contains the transaction types and the function to calculate the hook on
 */

// eslint-disable-next-line @typescript-eslint/no-require-imports -- Required
import createHash = require('create-hash')

import { HookParameter } from '../models/common'

/**
 * @constant tts
 * @description
 * Transaction types
 */
export const tts = {
  ttPAYMENT: 0,
  ttESCROW_CREATE: 1,
  ttESCROW_FINISH: 2,
  ttACCOUNT_SET: 3,
  ttESCROW_CANCEL: 4,
  ttREGULAR_KEY_SET: 5,
  ttOFFER_CREATE: 7,
  ttOFFER_CANCEL: 8,
  ttTICKET_CREATE: 10,
  ttSIGNER_LIST_SET: 12,
  ttPAYCHAN_CREATE: 13,
  ttPAYCHAN_FUND: 14,
  ttPAYCHAN_CLAIM: 15,
  ttCHECK_CREATE: 16,
  ttCHECK_CASH: 17,
  ttCHECK_CANCEL: 18,
  ttDEPOSIT_PREAUTH: 19,
  ttTRUST_SET: 20,
  ttACCOUNT_DELETE: 21,
  ttHOOK_SET: 22,
  ttNFTOKEN_MINT: 25,
  ttNFTOKEN_BURN: 26,
  ttNFTOKEN_CREATE_OFFER: 27,
  ttNFTOKEN_CANCEL_OFFER: 28,
  ttNFTOKEN_ACCEPT_OFFER: 29,
}

/**
 * @typedef TTS
 * @description
 * Transaction types
 */
export type TTS = typeof tts

/**
 * Calculate the hook on
 *
 * @param arr - array of transaction types
 * @returns the hook on
 */
export function calculateHookOn(arr: Array<keyof TTS>): string {
  let hash = '0x3e3ff5bf'
  arr.forEach((nth) => {
    let value = BigInt(hash)
    // eslint-disable-next-line no-bitwise -- Required
    value ^= BigInt(1) << BigInt(tts[nth])
    // eslint-disable-next-line @typescript-eslint/no-magic-numbers -- Required
    hash = `0x${value.toString(16)}`
  })
  hash = hash.replace('0x', '')
  // eslint-disable-next-line @typescript-eslint/no-magic-numbers -- Required
  hash = hash.padStart(64, '0')
  return hash.toUpperCase()
}

/**
 * Calculate the sha256 of a string
 *
 * @param string - the string to calculate the sha256
 * @returns the sha256
 */
export async function sha256(string: string): Promise<string> {
  const hash = createHash('sha256')
  hash.update(string)
  const hashBuffer = hash.digest()
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashHex = hashArray
    // eslint-disable-next-line @typescript-eslint/no-magic-numbers -- Required
    .map((bytes) => bytes.toString(16).padStart(2, '0'))
    .join('')
  return hashHex
}

/**
 * Calculate the hex of a namespace
 *
 * @param namespace - the namespace to calculate the hex
 * @returns the hex
 */
export async function hexNamespace(namespace: string): Promise<string> {
  return (await sha256(namespace)).toUpperCase()
}

/**
 * Calculate the hex of the hook parameters
 *
 * @param data - the hook parameters
 * @returns the hex of the hook parameters
 */
export function hexHookParameters(data: HookParameter[]): HookParameter[] {
  const hookParameters: HookParameter[] = []
  for (const parameter of data) {
    hookParameters.push({
      HookParameter: {
        HookParameterName: Buffer.from(
          parameter.HookParameter.HookParameterName,
          'utf8',
        )
          .toString('hex')
          .toUpperCase(),
        HookParameterValue: Buffer.from(
          parameter.HookParameter.HookParameterValue,
          'utf8',
        )
          .toString('hex')
          .toUpperCase(),
      },
    })
  }
  return hookParameters
}
