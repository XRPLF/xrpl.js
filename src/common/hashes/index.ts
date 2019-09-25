import BigNumber from 'bignumber.js'
import {decodeAddress} from 'ripple-address-codec'
import hash from './sha512hash'
import {HASH_TX_ID, HASH_TX_SIGN, HASH_LEDGER} from './hashprefix'
import {SHAMap, TYPE_TRANSACTION_MD, TYPE_ACCOUNT_STATE} from './shamap'
import {encode} from 'ripple-binary-codec'
import ledgerspaces from './ledgerspaces'

const padLeftZero = (string, length): string => {
  return Array(length - string.length + 1).join('0') + string
}

const intToHex = (integer, byteLength): string => {
  return padLeftZero(Number(integer).toString(16), byteLength * 2)
}

const bytesToHex = (bytes): string => {
  return (Buffer.from(bytes)).toString('hex')
}

const bigintToHex = (integerString, byteLength): string => {
  const hex = (new BigNumber(integerString)).toString(16)
  return padLeftZero(hex, byteLength * 2)
}

const ledgerSpaceHex = (name): string => {
  return intToHex(ledgerspaces[name].charCodeAt(0), 2)
}

const addressToHex = (address): string => {
  return (Buffer.from(decodeAddress(address))).toString('hex')
}

const currencyToHex = (currency): string => {
  if (currency.length === 3) {
    let bytes = new Array(20 + 1).join('0').split('').map(parseFloat)
    bytes[12] = currency.charCodeAt(0) & 0xff
    bytes[13] = currency.charCodeAt(1) & 0xff
    bytes[14] = currency.charCodeAt(2) & 0xff
    return bytesToHex(bytes)
  }
  return currency
}

const addLengthPrefix = (hex): string => {
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

export const computeBinaryTransactionHash = (txBlobHex): string => {
  const prefix = HASH_TX_ID.toString(16).toUpperCase()
  return hash(prefix + txBlobHex)
}

export const computeTransactionHash = (txJSON): string => {
  return computeBinaryTransactionHash(encode(txJSON))
}

export const computeBinaryTransactionSigningHash = (txBlobHex): string => {
  const prefix = HASH_TX_SIGN.toString(16).toUpperCase()
  return hash(prefix + txBlobHex)
}

export const computeTransactionSigningHash = (txJSON): string => {
  return computeBinaryTransactionSigningHash(encode(txJSON))
}

export const computeAccountHash = (address): string => {
  return hash(ledgerSpaceHex('account') + addressToHex(address))
}

export const computeSignerListHash = (address): string => {
  return hash(ledgerSpaceHex('signerList') +
              addressToHex(address) +
              '00000000' /* uint32(0) signer list index */)
}

export const computeOrderHash = (address, sequence): string => {
  const prefix = '00' + intToHex(ledgerspaces.offer.charCodeAt(0), 1)
  return hash(prefix + addressToHex(address) + intToHex(sequence, 4))
}

export const computeTrustlineHash = (address1, address2, currency): string => {
  const address1Hex = addressToHex(address1)
  const address2Hex = addressToHex(address2)

  const swap = (new BigNumber(address1Hex, 16)).greaterThan(
    new BigNumber(address2Hex, 16))
  const lowAddressHex = swap ? address2Hex : address1Hex
  const highAddressHex = swap ? address1Hex : address2Hex

  const prefix = ledgerSpaceHex('rippleState')
  return hash(prefix + lowAddressHex + highAddressHex +
              currencyToHex(currency))
}

export const computeTransactionTreeHash = (transactions, version): string => {
  const shamap = new SHAMap(version)

  transactions.forEach((txJSON) => {
    const txBlobHex = encode(txJSON)
    const metaHex = encode(txJSON.metaData)
    const txHash = computeBinaryTransactionHash(txBlobHex)
    const data = addLengthPrefix(txBlobHex) + addLengthPrefix(metaHex)
    shamap.add_item(txHash, data, TYPE_TRANSACTION_MD)
  })

  return shamap.hash
}

export const computeStateTreeHash = (entries, version: number): string => {
  const shamap = new SHAMap(version)

  entries.forEach((ledgerEntry) => {
    const data = encode(ledgerEntry)
    shamap.add_item(ledgerEntry.index, data, TYPE_ACCOUNT_STATE)
  })

  return shamap.hash
}

// see rippled Ledger::updateHash()
export const computeLedgerHash = (ledgerHeader): string => {
  const prefix = HASH_LEDGER.toString(16).toUpperCase()
  return hash(prefix +
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
  return hash(ledgerSpaceHex('escrow') + addressToHex(address) +
    intToHex(sequence, 4))
}

export const computePaymentChannelHash = (address, dstAddress, sequence): string => {
  return hash(ledgerSpaceHex('paychan') + addressToHex(address) +
    addressToHex(dstAddress) + intToHex(sequence, 4))
}