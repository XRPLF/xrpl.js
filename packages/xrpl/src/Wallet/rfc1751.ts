/* eslint-disable @typescript-eslint/no-magic-numbers -- Doing many bitwise operations which need specific numbers */
/* eslint-disable no-bitwise -- Bitwise operators are required for this encoding/decoding */
/* eslint-disable id-length -- Bitwise math uses shorthand terms */
/*
 *rfc1751.ts : Converts between 128-bit strings and a human-readable
 *sequence of words, as defined in RFC1751: "A Convention for
 *Human-Readable 128-bit Keys", by Daniel L. McDonald.
 *Ported from rfc1751.py / Python Cryptography Toolkit (public domain).
 *Copied from https://github.com/bip32/bip32.github.io/blob/master/js/rfc1751.js which
 *is part of the public domain.
 */

import { hexToBytes, concat } from '@xrplf/isomorphic/utils'

import rfc1751Words from './rfc1751Words.json'

const rfc1751WordList: string[] = rfc1751Words

// Added prettier-ignore to allow _BINARY to be on two lines, instead of one entry per line.

// prettier-ignore
const BINARY = ['0000', '0001', '0010', '0011', '0100', '0101', '0110', '0111',
                '1000', '1001', '1010', '1011', '1100', '1101', '1110', '1111'];

/**
 * Convert a number array into a binary string.
 *
 * @param key - An array of numbers in base 10.
 * @returns A binary string.
 */
function keyToBinary(key: number[]): string {
  let res = ''
  for (const num of key) {
    res += BINARY[num >> 4] + BINARY[num & 0x0f]
  }
  return res
}

/**
 * Converts a substring of an encoded secret to its numeric value.
 *
 * @param key - The encoded secret.
 * @param start - The start index to parse from.
 * @param length - The number of digits to parse after the start index.
 * @returns The binary value of the substring.
 */
function extract(key: string, start: number, length: number): number {
  const subKey = key.substring(start, start + length)
  let acc = 0
  for (let index = 0; index < subKey.length; index++) {
    acc = acc * 2 + subKey.charCodeAt(index) - 48
  }
  return acc
}

/**
 * Generates a modified RFC1751 mnemonic in the same way rippled's wallet_propose does.
 *
 * @param hex_key - An encoded secret in hex format.
 * @returns A mnemonic following rippled's modified RFC1751 mnemonic standard.
 */
function keyToRFC1751Mnemonic(hex_key: string): string {
  // Remove whitespace and interpret hex
  const buf = hexToBytes(hex_key.replace(/\s+/gu, ''))
  // Swap byte order and use rfc1751
  let key: number[] = bufferToArray(swap128(buf))

  // pad to 8 bytes
  const padding: number[] = []
  for (let index = 0; index < (8 - (key.length % 8)) % 8; index++) {
    padding.push(0)
  }
  key = padding.concat(key)

  const english: string[] = []
  for (let index = 0; index < key.length; index += 8) {
    const subKey = key.slice(index, index + 8)

    // add parity
    let skbin = keyToBinary(subKey)
    let parity = 0
    for (let j = 0; j < 64; j += 2) {
      parity += extract(skbin, j, 2)
    }
    subKey.push((parity << 6) & 0xff)

    skbin = keyToBinary(subKey)
    for (let j = 0; j < 64; j += 11) {
      english.push(rfc1751WordList[extract(skbin, j, 11)])
    }
  }
  return english.join(' ')
}

/**
 * Converts an english mnemonic following rippled's modified RFC1751 standard to an encoded hex secret.
 *
 * @param english - A mnemonic generated using ripple's modified RFC1751 standard.
 * @throws Error if the parity after decoding does not match.
 * @returns A Buffer containing an encoded secret.
 */
function rfc1751MnemonicToKey(english: string): Uint8Array {
  const words = english.split(' ')
  let key: number[] = []

  for (let index = 0; index < words.length; index += 6) {
    const { subKey, word }: { subKey: number[]; word: string } = getSubKey(
      words,
      index,
    )

    // check parity
    const skbin = keyToBinary(subKey)
    let parity = 0
    for (let j = 0; j < 64; j += 2) {
      parity += extract(skbin, j, 2)
    }
    const cs0 = extract(skbin, 64, 2)
    const cs1 = parity & 3
    if (cs0 !== cs1) {
      throw new Error(`Parity error at ${word}`)
    }

    key = key.concat(subKey.slice(0, 8))
  }

  // This is a step specific to the XRPL's implementation
  const bufferKey = swap128(Uint8Array.from(key))
  return bufferKey
}

function getSubKey(
  words: string[],
  index: number,
): { subKey: number[]; word: string } {
  const sublist = words.slice(index, index + 6)
  let bits = 0
  const ch = [0, 0, 0, 0, 0, 0, 0, 0, 0]
  let word = ''
  for (word of sublist) {
    const idx = rfc1751WordList.indexOf(word.toUpperCase())
    if (idx === -1) {
      throw new TypeError(
        `Expected an RFC1751 word, but received '${word}'. ` +
          `For the full list of words in the RFC1751 encoding see https://datatracker.ietf.org/doc/html/rfc1751`,
      )
    }
    const shift = (8 - ((bits + 11) % 8)) % 8
    const y = idx << shift
    const cl = y >> 16
    const cc = (y >> 8) & 0xff
    const cr = y & 0xff
    const t = Math.floor(bits / 8)
    if (shift > 5) {
      ch[t] |= cl
      ch[t + 1] |= cc
      ch[t + 2] |= cr
    } else if (shift > -3) {
      ch[t] |= cc
      ch[t + 1] |= cr
    } else {
      ch[t] |= cr
    }
    bits += 11
  }
  const subKey: number[] = ch.slice()
  return { subKey, word }
}

function bufferToArray(buf: Uint8Array): number[] {
  /* eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- We know the end type */
  return Array.prototype.slice.call(buf) as number[]
}

function swap(arr: Uint8Array, n: number, m: number): void {
  const i = arr[n]
  // eslint-disable-next-line no-param-reassign -- we have to swap
  arr[n] = arr[m]
  // eslint-disable-next-line no-param-reassign -- see above
  arr[m] = i
}

/**
 * Interprets arr as an array of 64-bit numbers and swaps byte order in 64 bit chunks.
 * Example of two 64 bit numbers 0000000100000002 => 1000000020000000
 *
 * @param arr A Uint8Array representation of one or more 64 bit numbers
 * @returns Uint8Array An array containing the bytes of 64 bit numbers each with reversed endianness
 */
function swap64(arr: Uint8Array): Uint8Array {
  const len = arr.length

  for (let i = 0; i < len; i += 8) {
    swap(arr, i, i + 7)
    swap(arr, i + 1, i + 6)
    swap(arr, i + 2, i + 5)
    swap(arr, i + 3, i + 4)
  }

  return arr
}

/**
 * Swap the byte order of a 128-bit array.
 * Ex. 0000000100000002 => 2000000010000000
 *
 * @param arr - A 128-bit (16 byte) array
 * @returns An array containing the same data with reversed endianness
 */
function swap128(arr: Uint8Array): Uint8Array {
  // Interprets arr as an array of (two, in this case) 64-bit numbers and swaps byte order in 64 bit chunks.
  // Ex. 0000000100000002 => 1000000020000000
  const reversedBytes = swap64(arr)
  // Further swap the two 64-bit numbers since our buffer is 128 bits.
  // Ex. 1000000020000000 => 2000000010000000
  return concat([reversedBytes.slice(8, 16), reversedBytes.slice(0, 8)])
}

export { rfc1751MnemonicToKey, keyToRFC1751Mnemonic }
