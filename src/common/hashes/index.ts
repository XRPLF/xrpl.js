import BigNumber from 'bignumber.js'
import {decodeAccountID} from 'ripple-address-codec'
import sha512Half from './sha512Half'
import HashPrefix from './hash-prefix'
import {SHAMap, NodeType} from './shamap'
import {encode} from 'ripple-binary-codec'
import ledgerspaces from './ledgerspaces'

const padLeftZero = (string: string, length: number): string => {
  return Array(length - string.length + 1).join('0') + string
}

const intToHex = (integer: number, byteLength: number): string => {
  return padLeftZero(Number(integer).toString(16), byteLength * 2)
}

const bytesToHex = (bytes: number[]): string => {
  return Buffer.from(bytes).toString('hex')
}

const bigintToHex = (integerString: string | number | BigNumber, byteLength: number): string => {
  const hex = (new BigNumber(integerString)).toString(16)
  return padLeftZero(hex, byteLength * 2)
}

const ledgerSpaceHex = (name: string): string => {
  return intToHex(ledgerspaces[name].charCodeAt(0), 2)
}

const addressToHex = (address: string): string => {
  return (Buffer.from(decodeAccountID(address))).toString('hex')
}

const currencyToHex = (currency: string): string => {
  if (currency.length === 3) {
    const bytes = new Array(20 + 1).join('0').split('').map(parseFloat)
    bytes[12] = currency.charCodeAt(0) & 0xff
    bytes[13] = currency.charCodeAt(1) & 0xff
    bytes[14] = currency.charCodeAt(2) & 0xff
    return bytesToHex(bytes)
  }
  return currency
}

const addLengthPrefix = (hex: string): string => {
  const length = hex.length / 2
  if (length <= 192) {
    return bytesToHex([length]) + hex
  } else if (length <= 12480) {
    const x = length - 193
    return bytesToHex([193 + (x >>> 8), x & 0xff]) + hex
  } else if (length <= 918744) {
    const x = length - 12481
    return bytesToHex([241 + (x >>> 16), x >>> 8 & 0xff, x & 0xff]) + hex
  }
  throw new Error('Variable integer overflow.')
}

export const computeBinaryTransactionHash = (txBlobHex: string): string => {
  const prefix = HashPrefix.TRANSACTION_ID.toString(16).toUpperCase()
  return sha512Half(prefix + txBlobHex)
}

export const computeTransactionHash = (txJSON: any): string => {
  return computeBinaryTransactionHash(encode(txJSON))
}

export const computeBinaryTransactionSigningHash = (txBlobHex: string): string => {
  const prefix = HashPrefix.TRANSACTION_SIGN.toString(16).toUpperCase()
  return sha512Half(prefix + txBlobHex)
}

export const computeTransactionSigningHash = (txJSON: any): string => {
  return computeBinaryTransactionSigningHash(encode(txJSON))
}

export const computeAccountHash = (address: string): string => {
  return sha512Half(ledgerSpaceHex('account') + addressToHex(address))
}

export const computeSignerListHash = (address: string): string => {
  return sha512Half(ledgerSpaceHex('signerList') +
              addressToHex(address) +
              '00000000') // uint32(0) signer list index
}

export const computeOrderHash = (address: string, sequence: number): string => {
  const prefix = '00' + intToHex(ledgerspaces.offer.charCodeAt(0), 1)
  return sha512Half(prefix + addressToHex(address) + intToHex(sequence, 4))
}

export const computeTrustlineHash = (address1: string, address2: string, currency: string): string => {
  const address1Hex = addressToHex(address1)
  const address2Hex = addressToHex(address2)

  const swap = (new BigNumber(address1Hex, 16)).greaterThan(
    new BigNumber(address2Hex, 16))
  const lowAddressHex = swap ? address2Hex : address1Hex
  const highAddressHex = swap ? address1Hex : address2Hex

  const prefix = ledgerSpaceHex('rippleState')
  return sha512Half(prefix + lowAddressHex + highAddressHex +
              currencyToHex(currency))
}

export const computeTransactionTreeHash = (transactions: any[]): string => {
  const shamap = new SHAMap()

  transactions.forEach(txJSON => {
    const txBlobHex = encode(txJSON)
    const metaHex = encode(txJSON.metaData)
    const txHash = computeBinaryTransactionHash(txBlobHex)
    const data = addLengthPrefix(txBlobHex) + addLengthPrefix(metaHex)
    shamap.addItem(txHash, data, NodeType.TRANSACTION_METADATA)
  })

  return shamap.hash
}

export const computeStateTreeHash = (entries: any[]): string => {
  const shamap = new SHAMap()

  entries.forEach(ledgerEntry => {
    const data = encode(ledgerEntry)
    shamap.addItem(ledgerEntry.index, data, NodeType.ACCOUNT_STATE)
  })

  return shamap.hash
}

// see rippled Ledger::updateHash()
export const computeLedgerHash = (ledgerHeader): string => {
  const prefix = HashPrefix.LEDGER.toString(16).toUpperCase()
  return sha512Half(prefix +
    intToHex(ledgerHeader.ledger_index, 4) +
    bigintToHex(ledgerHeader.total_coins, 8) +
    ledgerHeader.parent_hash +
    ledgerHeader.transaction_hash +
    ledgerHeader.account_hash +
    intToHex(ledgerHeader.parent_close_time, 4) +
    intToHex(ledgerHeader.close_time, 4) +
    intToHex(ledgerHeader.close_time_resolution, 1) +
    intToHex(ledgerHeader.close_flags, 1)
  )
}

export const computeEscrowHash = (address, sequence): string => {
  return sha512Half(ledgerSpaceHex('escrow') + addressToHex(address) +
    intToHex(sequence, 4))
}

export const computePaymentChannelHash = (address, dstAddress, sequence): string => {
  return sha512Half(ledgerSpaceHex('paychan') + addressToHex(address) +
    addressToHex(dstAddress) + intToHex(sequence, 4))
}
