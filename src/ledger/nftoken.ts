import axios from 'axios'
import parseDataUri from 'data-urls'
import toml from 'toml'

import {RippleAPI} from '..'
import {ArgumentError, ValidationError} from '../common/errors'

const HTTP_TIMEOUT_MS = 3000
const DEFAULT_TAXON = 0
const MAX_ON_LEDGER_STORAGE_BYTES = 512

export enum NFTokenStorageOption {
  OnLedger,
  CentralizedOffLedger,
}

export interface NFTokenParameters {
  issuingAccount: string,
  storageOption: NFTokenStorageOption,
  uri: string,
  taxon?: number,
}

const uriToHex = (uri: string): string => (
  uri.split('').map((char) => (
    char.charCodeAt(0).toString(16).padStart(2, '0')
  )).join('').toUpperCase()
)

const validateOnLedger = (
  params: NFTokenParameters,
): void => {
  const { uri } = params

  // Confirm that data URI is <= the max recommended byte size
  if (uri.length > MAX_ON_LEDGER_STORAGE_BYTES) {
    throw new ValidationError(`${uri} is greater than ${MAX_ON_LEDGER_STORAGE_BYTES} bytes`)
  }

  // Confirm that URI is a correctly-encoded data URI
  if (parseDataUri(uri) == null) {
    throw new ValidationError(`${uri} is not a correctly-encoded data URI, as recommended`)
  }
}

const validateCentralizedOffLedger = async (
  params: NFTokenParameters
): Promise<void> => {
  const { uri, issuingAccount } = params

  // Confirm that `uri` is a valid URL
  let parsedUri
  try {
    parsedUri = new URL(uri)
  } catch (_err) {
    throw new ValidationError(`${uri} is not present or not a valid URL`)
  }

  // Confirm that `uri` exists
  try {
    await axios({
      method: 'head',
      responseType: 'document',
      timeout: HTTP_TIMEOUT_MS,
      url: uri,
    })
  } catch (_err) {
    throw new ValidationError(`${uri} does not return a 200-level HTTP response after redirects within ${HTTP_TIMEOUT_MS / 1000} seconds. Please ensure that ${uri} allows CORS`)
  }

  // Confirm that domain of `uri` contains an `xrp-ledger.toml` file
  let httpResponse
  // TODO allow checking against domain if given a subdomain
  const tomlUri = `https://${parsedUri.host}/.well-known/xrp-ledger.toml`
  try {
    httpResponse = await axios({
      method: 'get',
      responseType: 'document',
      timeout: HTTP_TIMEOUT_MS,
      url: tomlUri,
    })
  } catch (_err) {
    throw new ValidationError(`Could not HTTP GET the recommended xrp-ledger.toml file at ${tomlUri}`)
  }

  // Confirm that the `xrp-ledger.toml` file lists the `issuingAccount` as an
  // associated account
  let parsedToml
  try {
    parsedToml = toml.parse(httpResponse.data)
  } catch (_err) {
    throw new ValidationError(`The xrp-ledger.toml file at ${tomlUri} is malformed or doesn't exist`)
  }

  if (!parsedToml.ACCOUNTS) {
    throw new ValidationError(`The xrp-ledger.toml file at ${tomlUri} doesn't contain an ACCOUNTS section`)
  }
  if (!parsedToml.ACCOUNTS.find((entry) => entry.address === issuingAccount)) {
    throw new ValidationError(`The xrp-ledger.toml file at ${tomlUri} doesn't contain issuing account ${issuingAccount} in the ACCOUNTS section as recommended`)
  }
}

export const validateNFToken = async (
  params: NFTokenParameters,
): Promise<void> => {
  const { storageOption } = params
  switch (storageOption) {
    case NFTokenStorageOption.OnLedger:
      return validateOnLedger(params)
    case NFTokenStorageOption.CentralizedOffLedger:
      return await validateCentralizedOffLedger(params)
    default:
      throw new ArgumentError(`Unrecognized storage option ${storageOption}`)
  }
}

export const isNFTokenValid = async (
  params: NFTokenParameters,
): Promise<boolean> => {
  try {
    await validateNFToken(params)
  } catch (_err) {
    return false
  }
  return true
}

export interface CreateNFTokenParameters extends NFTokenParameters {
  skipValidation?: boolean,
}

export const createNFToken = async (
  client: RippleAPI,
  senderSecret: string,
  params: CreateNFTokenParameters,
): Promise<Object> => {
  // Validate prospective token
  if (params.skipValidation !== true) {
    await validateNFToken(params)
  }

  // Create tx
  const mintTx = {
    TransactionType: 'NFTokenMint',
    Account: params.issuingAccount,
    TokenTaxon: params.taxon ?? DEFAULT_TAXON,
    URI: uriToHex(params.uri),
  }
  
  // Submit it
  // TODO: perhaps this function shouldn't actually submit for you, but rather
  // just return the populated tx for users to manipulate and later
  // sign/submit themselves
  const preparedTx = await client.prepareTransaction(mintTx)
  const signedTx = client.sign(preparedTx.txJSON, senderSecret)
  const response = await client.request('submit', {
      tx_blob: signedTx.signedTransaction,
  })
  return response.tx_json
}
