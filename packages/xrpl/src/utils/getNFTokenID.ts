/* eslint-disable @typescript-eslint/promise-function-async */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unnecessary-condition */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/consistent-type-assertions */
import {
  CreatedNode,
  ModifiedNode,
  Node,
  TransactionMetadata,
} from '../models/transactions/metadata'

/**
 * Gets the NFTokenID for an NFT recently minted with NFTokenMint.
 *
 * @param meta - Metadata from the response to submitting an NFTokenMint transaction.
 * @returns The NFTokenID for the minted NFT.
 */
export default function getNFTokenID(
  meta: TransactionMetadata,
): string | undefined {
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
  const affectedNodes = meta.AffectedNodes.filter(
    (node: Node) =>
      (node as CreatedNode)?.CreatedNode?.LedgerEntryType === 'NFTokenPage' ||
      ((node as ModifiedNode)?.ModifiedNode?.LedgerEntryType ===
        'NFTokenPage' &&
        Boolean(
          (node as ModifiedNode)?.ModifiedNode?.PreviousFields?.NFTokens,
        )),
  )

  const previousTokenIDSet = new Set(
    affectedNodes
      .flatMap(
        (node: Node) =>
          (
            (node as ModifiedNode)?.ModifiedNode?.PreviousFields
              ?.NFTokens as any[]
          )?.map((token: any) => token.NFToken.NFTokenID), // Guessed that this was an AccountNFT, but incorrectly
      )
      .filter((id: string) => id),
  )

  const step_1 = affectedNodes.flatMap(
    (node: Node) =>
      (
        (
          (node as ModifiedNode).ModifiedNode?.FinalFields ??
          (node as CreatedNode).CreatedNode?.NewFields
        )?.NFTokens as any[]
      )?.map((token: any) => token.NFToken.NFTokenID), // Token was previously guessed to be AccountNFT
  ) as string[]

  const finalTokenIDs: string[] = step_1.filter(
    (nftokenID: string) => nftokenID,
  )

  const nftokenID = finalTokenIDs.find(
    (id: string) => !previousTokenIDSet.has(id),
  )

  return nftokenID
}
