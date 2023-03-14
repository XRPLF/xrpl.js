import flatMap from 'lodash/flatMap'

import {
  CreatedNode,
  isCreatedNode,
  isModifiedNode,
  ModifiedNode,
  TransactionMetadata,
} from '../models/transactions/metadata'

interface NFToken {
  NFToken: {
    NFTokenID: string
    URI: string
  }
}

/**
 * Gets the NFTokenID for an NFT recently minted with NFTokenMint.
 *
 * @param meta - Metadata from the response to submitting an NFTokenMint transaction.
 * @returns The NFTokenID for the minted NFT.
 * @throws if meta is not TransactionMetadata.
 */
export default function getNFTokenID(
  meta: TransactionMetadata,
): string | undefined {
  /* eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- Provides a nicer error for js users */
  if (meta.AffectedNodes === undefined) {
    throw new TypeError(`Unable to parse the parameter given to getNFTokenID. 
    'meta' must be the metadata from an NFTokenMint transaction. Received ${JSON.stringify(
      meta,
    )} instead.`)
  }

  /*
   * When a mint results in splitting an existing page,
   * it results in a created page and a modified node. Sometimes,
   * the created node needs to be linked to a third page, resulting
   * in modifying that third page's PreviousPageMin or NextPageMin
   * field changing, but no NFTs within that page changing. In this
   * case, there will be no previous NFTs and we need to skip.
   * However, there will always be NFTs listed in the final fields,
   * as rippled outputs all fields in final fields even if they were
   * not changed. Thus why we add the additional condition to check
   * if the PreviousFields contains NFTokens
   */

  const affectedNodes = meta.AffectedNodes.filter((node) => {
    if (isCreatedNode(node)) {
      return node.CreatedNode.LedgerEntryType === 'NFTokenPage'
    }
    if (isModifiedNode(node)) {
      return (
        node.ModifiedNode.LedgerEntryType === 'NFTokenPage' &&
        Boolean(node.ModifiedNode.PreviousFields?.NFTokens)
      )
    }
    return false
  })
  /* eslint-disable @typescript-eslint/consistent-type-assertions -- Necessary for parsing metadata */
  const previousTokenIDSet = new Set(
    flatMap(affectedNodes, (node) => {
      const nftokens = isModifiedNode(node)
        ? (node.ModifiedNode.PreviousFields?.NFTokens as NFToken[])
        : []
      return nftokens.map((token) => token.NFToken.NFTokenID)
    }).filter((id) => Boolean(id)),
  )

  /* eslint-disable @typescript-eslint/no-unnecessary-condition -- Cleaner to read */
  const finalTokenIDs = flatMap(affectedNodes, (node) =>
    (
      (((node as ModifiedNode).ModifiedNode?.FinalFields?.NFTokens ??
        (node as CreatedNode).CreatedNode?.NewFields?.NFTokens) as NFToken[]) ??
      []
    ).map((token) => token.NFToken.NFTokenID),
  ).filter((nftokenID) => Boolean(nftokenID))
  /* eslint-enable @typescript-eslint/consistent-type-assertions -- Necessary for parsing metadata */
  /* eslint-enable @typescript-eslint/no-unnecessary-condition -- Cleaner to read */

  const nftokenID = finalTokenIDs.find((id) => !previousTokenIDSet.has(id))

  return nftokenID
}
