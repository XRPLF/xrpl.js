import _ from 'lodash'

import { Amount, RippledAmount } from '../../common/types/objects'
import { Path, GetPaths, RippledPathsResponse } from '../pathfind-types'

import parseAmount from './amount'

function parsePaths(paths) {
  return paths.map((steps) =>
    steps.map((step) => _.omit(step, ['type', 'type_hex'])),
  )
}

function removeAnyCounterpartyEncoding(address: string, amount: Amount) {
  return amount.counterparty === address
    ? _.omit(amount, 'counterparty')
    : amount
}

function createAdjustment(
  address: string,
  adjustmentWithoutAddress: object,
): any {
  const amountKey = Object.keys(adjustmentWithoutAddress)[0]
  const amount = adjustmentWithoutAddress[amountKey]
  return _.set(
    { address },
    amountKey,
    removeAnyCounterpartyEncoding(address, amount),
  )
}

function parseAlternative(
  sourceAddress: string,
  destinationAddress: string,
  destinationAmount: RippledAmount,
  alternative: any,
): Path {
  // we use "maxAmount"/"minAmount" here so that the result can be passed
  // directly to preparePayment
  const amounts =
    alternative.destination_amount != null
      ? {
          source: { amount: parseAmount(alternative.source_amount) },
          destination: {
            minAmount: parseAmount(alternative.destination_amount),
          },
        }
      : {
          source: { maxAmount: parseAmount(alternative.source_amount) },
          destination: { amount: parseAmount(destinationAmount) },
        }

  return {
    source: createAdjustment(sourceAddress, amounts.source),
    destination: createAdjustment(destinationAddress, amounts.destination),
    paths: JSON.stringify(parsePaths(alternative.paths_computed)),
  }
}

function parsePathfind(pathfindResult: RippledPathsResponse): GetPaths {
  const sourceAddress = pathfindResult.source_account
  const destinationAddress = pathfindResult.destination_account
  const destinationAmount = pathfindResult.destination_amount
  return pathfindResult.alternatives.map((alt) =>
    parseAlternative(sourceAddress, destinationAddress, destinationAmount, alt),
  )
}

export default parsePathfind
