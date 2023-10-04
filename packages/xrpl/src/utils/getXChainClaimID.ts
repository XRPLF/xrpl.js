import { decode } from 'ripple-binary-codec'

import {
  CreatedNode,
  isCreatedNode,
  TransactionMetadata,
} from '../models/transactions/metadata'

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
 * Gets the XChainClaimID value from the metadata of an `XChainCreateClaimID` transaction.
 *
 * @param meta - Metadata from the response to submitting and waiting for an XChainCreateClaimID transaction
 *               or from a `tx` method call.
 * @returns The XChainClaimID for the minted NFT.
 * @throws if meta is not TransactionMetadata.
 */
export default function getXChainClaimID(
  meta: TransactionMetadata | string | undefined,
): string | undefined {
  if (typeof meta !== 'string' && meta?.AffectedNodes === undefined) {
    throw new TypeError(`Unable to parse the parameter given to getXChainClaimID.
      'meta' must be the metadata from an XChainCreateClaimID transaction. Received ${JSON.stringify(
        meta,
      )} instead.`)
  }

  const decodedMeta = ensureDecodedMeta(meta)

  if (!decodedMeta.TransactionResult) {
    throw new TypeError(
      'Cannot get XChainClaimID from un-validated transaction',
    )
  }

  if (decodedMeta.TransactionResult !== 'tesSUCCESS') {
    return undefined
  }

  const createdNode = decodedMeta.AffectedNodes.find(
    (node) =>
      isCreatedNode(node) &&
      node.CreatedNode.LedgerEntryType === 'XChainOwnedClaimID',
  )

  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- necessary here
  return (createdNode as CreatedNode).CreatedNode.NewFields
    .XChainClaimID as string
}
