/* eslint-disable max-lines -- utility file */
/* eslint-disable no-continue -- makes logic easier to write and read in this case */

import { hexToString, stringToHex } from '@xrplf/isomorphic/utils'
import stableStringify from 'fast-json-stable-stringify'

import type { MPTokenMetadata } from '../common'
import { isRecord, isString } from '../transactions/common'

import { isHex } from '.'

export const MAX_MPT_META_BYTE_LENGTH = 1024
export const MPT_META_WARNING_HEADER =
  'MPTokenMetadata is not properly formatted as JSON as per the XLS-89 standard. ' +
  "While adherence to this standard is not mandatory, such non-compliant MPToken's might not be discoverable " +
  'by Explorers and Indexers in the XRPL ecosystem.'

const MPT_META_URI_FIELDS = [
  {
    long: 'uri',
    compact: 'u',
  },
  {
    long: 'category',
    compact: 'c',
  },
  {
    long: 'title',
    compact: 't',
  },
]

const MPT_META_ALL_FIELDS = [
  {
    long: 'ticker',
    compact: 't',
    validate(obj: Record<string, unknown>): string[] {
      if (obj[this.long] != null && obj[this.compact] != null) {
        return [
          `${this.long}/${this.compact}: both long and compact forms present. expected only one.`,
        ]
      }

      const value = obj[this.long] ?? obj[this.compact]
      if (!isString(value) || !/^[A-Z0-9]{1,6}$/u.test(value)) {
        return [
          `${this.long}/${this.compact}: should have uppercase letters (A-Z) and digits (0-9) only. Max 6 characters recommended.`,
        ]
      }

      return []
    },
  },
  {
    long: 'name',
    compact: 'n',
    validate(obj: Record<string, unknown>): string[] {
      if (obj[this.long] != null && obj[this.compact] != null) {
        return [
          `${this.long}/${this.compact}: both long and compact forms present. expected only one.`,
        ]
      }

      const value = obj[this.long] ?? obj[this.compact]
      if (!isString(value) || value.length === 0) {
        return [`${this.long}/${this.compact}: should be a non-empty string.`]
      }

      return []
    },
  },
  {
    long: 'icon',
    compact: 'i',
    validate(obj: Record<string, unknown>): string[] {
      if (obj[this.long] != null && obj[this.compact] != null) {
        return [
          `${this.long}/${this.compact}: both long and compact forms present. expected only one.`,
        ]
      }

      const value = obj[this.long] ?? obj[this.compact]
      if (!isString(value) || value.length === 0) {
        return [`${this.long}/${this.compact}: should be a non-empty string.`]
      }

      return []
    },
  },
  {
    long: 'asset_class',
    compact: 'ac',
    validate(obj: Record<string, unknown>): string[] {
      if (obj[this.long] != null && obj[this.compact] != null) {
        return [
          `${this.long}/${this.compact}: both long and compact forms present. expected only one.`,
        ]
      }

      const value = obj[this.long] ?? obj[this.compact]
      const MPT_META_ASSET_CLASSES = [
        'rwa',
        'memes',
        'wrapped',
        'gaming',
        'defi',
        'other',
      ]

      if (!isString(value) || !MPT_META_ASSET_CLASSES.includes(value)) {
        return [
          `${this.long}/${this.compact}: should be one of ${MPT_META_ASSET_CLASSES.join(
            ', ',
          )}.`,
        ]
      }
      return []
    },
  },
  {
    long: 'issuer_name',
    compact: 'in',
    validate(obj: Record<string, unknown>): string[] {
      if (obj[this.long] != null && obj[this.compact] != null) {
        return [
          `${this.long}/${this.compact}: both long and compact forms present. expected only one.`,
        ]
      }

      const value = obj[this.long] ?? obj[this.compact]
      if (!isString(value) || value.length === 0) {
        return [`${this.long}/${this.compact}: should be a non-empty string.`]
      }

      return []
    },
  },
  {
    long: 'desc',
    compact: 'd',
    validate(obj: Record<string, unknown>): string[] {
      if (obj[this.long] != null && obj[this.compact] != null) {
        return [
          `${this.long}/${this.compact}: both long and compact forms present. expected only one.`,
        ]
      }

      if (obj[this.long] === undefined && obj[this.compact] === undefined) {
        return []
      }
      const value = obj[this.long] ?? obj[this.compact]
      if (!isString(value) || value.length === 0) {
        return [`${this.long}/${this.compact}: should be a non-empty string.`]
      }

      return []
    },
  },
  {
    long: 'asset_subclass',
    compact: 'as',
    required: false,
    validate(obj: Record<string, unknown>): string[] {
      if (obj[this.long] != null && obj[this.compact] != null) {
        return [
          `${this.long}/${this.compact}: both long and compact forms present. expected only one.`,
        ]
      }

      const value = obj[this.long] ?? obj[this.compact]
      if (
        (obj.asset_class === 'rwa' || obj.ac === 'rwa') &&
        value === undefined
      ) {
        return [
          `${this.long}/${this.compact}: required when asset_class is rwa.`,
        ]
      }

      if (obj[this.long] === undefined && obj[this.compact] === undefined) {
        return []
      }

      const MPT_META_ASSET_SUB_CLASSES = [
        'stablecoin',
        'commodity',
        'real_estate',
        'private_credit',
        'equity',
        'treasury',
        'other',
      ]
      if (!isString(value) || !MPT_META_ASSET_SUB_CLASSES.includes(value)) {
        return [
          `${this.long}/${this.compact}: should be one of ${MPT_META_ASSET_SUB_CLASSES.join(
            ', ',
          )}.`,
        ]
      }
      return []
    },
  },
  {
    long: 'uris',
    compact: 'us',
    required: false,
    // eslint-disable-next-line max-lines-per-function -- required for validation
    validate(obj: Record<string, unknown>): string[] {
      if (obj[this.long] != null && obj[this.compact] != null) {
        return [
          `${this.long}/${this.compact}: both long and compact forms present. expected only one.`,
        ]
      }

      if (obj[this.long] === undefined && obj[this.compact] === undefined) {
        return []
      }
      const value = obj[this.long] ?? obj[this.compact]
      if (!Array.isArray(value) || value.length === 0) {
        return [`${this.long}/${this.compact}: should be a non-empty array.`]
      }

      const messages: string[] = []
      for (const uriObj of value) {
        if (
          !isRecord(uriObj) ||
          Object.keys(uriObj).length !== MPT_META_URI_FIELDS.length
        ) {
          messages.push(
            `${this.long}/${this.compact}: should be an array of objects each with uri/u, category/c, and title/t properties.`,
          )
          continue
        }

        // Check for both long and compact forms in the same URI object
        for (const uriField of MPT_META_URI_FIELDS) {
          if (
            uriObj[uriField.long] != null &&
            uriObj[uriField.compact] != null
          ) {
            messages.push(
              `${this.long}/${this.compact}: should not have both ${uriField.long} and ${uriField.compact} fields.`,
            )
            break
          }
        }

        const uri = uriObj.uri ?? uriObj.u
        const category = uriObj.category ?? uriObj.c
        const title = uriObj.title ?? uriObj.t
        if (!isString(uri) || !isString(category) || !isString(title)) {
          messages.push(
            `${this.long}/${this.compact}: should be an array of objects each with uri/u, category/c, and title/t properties.`,
          )
        }
      }
      return messages
    },
  },
  {
    long: 'additional_info',
    compact: 'ai',
    required: false,
    validate(obj: Record<string, unknown>): string[] {
      if (obj[this.long] != null && obj[this.compact] != null) {
        return [
          `${this.long}/${this.compact}: both long and compact forms present. expected only one.`,
        ]
      }

      if (obj[this.long] === undefined && obj[this.compact] === undefined) {
        return []
      }
      const value = obj[this.long] ?? obj[this.compact]
      if (!isString(value) && !isRecord(value)) {
        return [
          `${this.long}/${this.compact}: should be a string or JSON object.`,
        ]
      }

      return []
    },
  },
]

/**
 * Shortens long field names to their compact form equivalents.
 * Reverse operation of {@link expandKeys}.
 *
 * @param input - Object with potentially long field names.
 * @param mappings - Array of field mappings with long and compact names.
 * @returns Object with shortened compact field names.
 */
function shortenKeys(
  input: Record<string, unknown>,
  mappings: Array<{ long: string; compact: string }>,
): Record<string, unknown> {
  const output: Record<string, unknown> = {}

  for (const [key, value] of Object.entries(input)) {
    const mapping = mappings.find(
      ({ long, compact }) => long === key || compact === key,
    )
    // Extra keys stays there
    if (mapping === undefined) {
      output[key] = value
      continue
    }

    // Both long and compact forms are present
    if (
      input[mapping.long] !== undefined &&
      input[mapping.compact] !== undefined
    ) {
      output[key] = value
      continue
    }

    output[mapping.compact] = value
  }

  return output
}

/**
 * Encodes {@link MPTokenMetadata} object to a hex string.
 * Steps:
 * 1. Shorten long field names to their compact form equivalents.
 * 2. Sort the fields alphabetically for deterministic encoding.
 * 3. Stringify the object.
 * 4. Convert to hex.
 *
 * @param mptokenMetadata - {@link MPTokenMetadata} to encode.
 * @returns Hex encoded {@link MPTokenMetadata}.
 * @throws Error if input is not a JSON object.
 * @category Utilities
 */
export function encodeMPTokenMetadata(
  mptokenMetadata: MPTokenMetadata,
): string {
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- Required here to implement type-guard
  let input = mptokenMetadata as unknown as Record<string, unknown>

  if (!isRecord(input)) {
    throw new Error('MPTokenMetadata must be JSON object.')
  }

  input = shortenKeys(input, MPT_META_ALL_FIELDS)

  if (Array.isArray(input.uris)) {
    input.uris = input.uris.map(
      (uri: Record<string, unknown>): Record<string, unknown> => {
        if (isRecord(uri)) {
          return shortenKeys(uri, MPT_META_URI_FIELDS)
        }
        return uri
      },
    )
  }

  if (Array.isArray(input.us)) {
    input.us = input.us.map(
      (uri: Record<string, unknown>): Record<string, unknown> => {
        if (isRecord(uri)) {
          return shortenKeys(uri, MPT_META_URI_FIELDS)
        }
        return uri
      },
    )
  }

  return stringToHex(stableStringify(input)).toUpperCase()
}

/**
 * Expands compact field names to their long form equivalents.
 * Reverse operation of {@link shortenKeys}.
 *
 * @param input - Object with potentially compact field names.
 * @param mappings - Array of field mappings with long and compact names.
 * @returns Object with expanded long field names.
 */
function expandKeys(
  input: Record<string, unknown>,
  mappings: Array<{ long: string; compact: string }>,
): Record<string, unknown> {
  const output: Record<string, unknown> = {}

  for (const [key, value] of Object.entries(input)) {
    const mapping = mappings.find(
      ({ long, compact }) => long === key || compact === key,
    )
    // Extra keys stays there
    if (mapping === undefined) {
      output[key] = value
      continue
    }

    // Both long and compact forms are present
    if (
      input[mapping.long] !== undefined &&
      input[mapping.compact] !== undefined
    ) {
      output[key] = value
      continue
    }

    output[mapping.long] = value
  }

  return output
}

/**
 * Decodes hex-encoded {@link MPTokenMetadata} into a JSON object.
 * Converts compact field names to their corresponding long-form equivalents.
 *
 * @param input - Hex encoded {@link MPTokenMetadata}.
 * @returns Decoded {@link MPTokenMetadata} object with long field names.
 * @throws Error if input is not valid hex or cannot be parsed as JSON.
 * @category Utilities
 */
export function decodeMPTokenMetadata(input: string): MPTokenMetadata {
  if (!isHex(input)) {
    throw new Error('MPTokenMetadata must be in hex format.')
  }

  let jsonMetaData: unknown
  try {
    jsonMetaData = JSON.parse(hexToString(input))
  } catch (err) {
    throw new Error(
      `MPTokenMetadata is not properly formatted as JSON - ${String(err)}`,
    )
  }

  if (!isRecord(jsonMetaData)) {
    throw new Error('MPTokenMetadata must be a JSON object.')
  }

  let output = jsonMetaData

  output = expandKeys(output, MPT_META_ALL_FIELDS)

  if (Array.isArray(output.uris)) {
    output.uris = output.uris.map(
      (uri: Record<string, unknown>): Record<string, unknown> => {
        if (isRecord(uri)) {
          return expandKeys(uri, MPT_META_URI_FIELDS)
        }
        return uri
      },
    )
  }

  if (Array.isArray(output.us)) {
    output.us = output.us.map(
      (uri: Record<string, unknown>): Record<string, unknown> => {
        if (isRecord(uri)) {
          return expandKeys(uri, MPT_META_URI_FIELDS)
        }
        return uri
      },
    )
  }

  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- Required here as output is now properly formatted
  return output as unknown as MPTokenMetadata
}

/**
 * Validates {@link MPTokenMetadata} adheres to XLS-89 standard.
 *
 * @param input - Hex encoded {@link MPTokenMetadata}.
 * @returns Validation messages if {@link MPTokenMetadata} does not adheres to XLS-89 standard.
 * @category Utilities
 */
export function validateMPTokenMetadata(input: string): string[] {
  const validationMessages: string[] = []

  // Validate hex format
  if (!isHex(input)) {
    validationMessages.push(`MPTokenMetadata must be in hex format.`)
    return validationMessages
  }

  // Validate byte length
  if (input.length / 2 > MAX_MPT_META_BYTE_LENGTH) {
    validationMessages.push(
      `MPTokenMetadata must be max ${MAX_MPT_META_BYTE_LENGTH} bytes.`,
    )
    return validationMessages
  }

  // Parse JSON
  let jsonMetaData: unknown
  try {
    jsonMetaData = JSON.parse(hexToString(input))
  } catch (err) {
    validationMessages.push(
      `MPTokenMetadata is not properly formatted as JSON - ${String(err)}`,
    )
    return validationMessages
  }

  // Validate JSON structure
  if (!isRecord(jsonMetaData)) {
    validationMessages.push(
      'MPTokenMetadata is not properly formatted JSON object as per XLS-89.',
    )
    return validationMessages
  }

  if (Object.keys(jsonMetaData).length > MPT_META_ALL_FIELDS.length) {
    validationMessages.push(
      `MPTokenMetadata must not contain more than ${MPT_META_ALL_FIELDS.length} top-level fields (found ${
        Object.keys(jsonMetaData).length
      }).`,
    )
  }

  const obj = jsonMetaData

  for (const property of MPT_META_ALL_FIELDS) {
    validationMessages.push(...property.validate(obj))
  }

  return validationMessages
}
