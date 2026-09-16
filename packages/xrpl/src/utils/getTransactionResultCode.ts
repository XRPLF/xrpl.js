import { decode } from 'ripple-binary-codec'

import { TransactionMetadata } from '../models/transactions/metadata'

/**
 * Ensures that the metadata is in a deserialized format to parse.
 *
 * @param meta - the metadata from a `tx` method call. Can be in json format or binary format.
 * @returns the metadata in a deserialized format.
 */
function ensureDecodedMeta(
  meta: TransactionMetadata | string,
): TransactionMetadata {
  if (typeof meta === 'string') {
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- Meta is either metadata or serialized metadata.
    return decode(meta) as unknown as TransactionMetadata
  }
  return meta
}

/**
 * Gets the transaction engine result code (e.g. `tesSUCCESS`, `tecUNFUNDED_PAYMENT`)
 * from the metadata of a validated transaction. This is the field to check to determine
 * whether a transaction succeeded, since `submitAndWait` only throws for submission-level
 * problems (such as an expired `LastLedgerSequence`) and resolves normally for any
 * transaction that reached a validated ledger, including ones that failed on-ledger.
 *
 * @param meta - Metadata from the response to `submitAndWait`, a `tx` method call, or any
 *               other response that includes transaction metadata. Can be in JSON or binary format.
 * @returns The `TransactionResult` engine result code.
 * @throws {TypeError} if meta is missing, or is metadata from an un-validated transaction.
 * @category Utilities
 */
export default function getTransactionResultCode(
  meta: TransactionMetadata | string | undefined,
): string {
  if (meta == null) {
    throw new TypeError(`Unable to parse the parameter given to getTransactionResultCode.
      'meta' must be the metadata from a validated transaction. Received ${JSON.stringify(
        meta,
      )} instead.`)
  }

  const decodedMeta = ensureDecodedMeta(meta)

  if (!decodedMeta.TransactionResult) {
    throw new TypeError(
      'Cannot get the transaction result code from an un-validated transaction',
    )
  }

  return decodedMeta.TransactionResult
}
