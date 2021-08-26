import BigNumber from "bignumber.js";

import { FormattedOrderSpecification } from "../../common/types/objects";
import { removeUndefined } from "../../utils";

import parseAmount from "./amount";
import { orderFlags } from "./flags";
import { parseTimestamp, adjustQualityForXRP } from "./utils";

export interface FormattedAccountOrder {
  specification: FormattedOrderSpecification;
  properties: {
    maker: string;
    sequence: number;
    makerExchangeRate: string;
  };
}

// TODO: remove this function once rippled provides quality directly
function computeQuality(takerGets, takerPays) {
  const quotient = new BigNumber(takerPays.value).dividedBy(takerGets.value);
  return quotient.precision(16, BigNumber.ROUND_HALF_UP).toString();
}

// rippled 'account_offers' returns a different format for orders than 'tx'
// the flags are also different
export function parseAccountOrder(
  address: string,
  order: any
): FormattedAccountOrder {
  const direction = (order.flags & orderFlags.Sell) === 0 ? "buy" : "sell";
  const takerGetsAmount = parseAmount(order.taker_gets);
  const takerPaysAmount = parseAmount(order.taker_pays);
  const quantity = direction === "buy" ? takerPaysAmount : takerGetsAmount;
  const totalPrice = direction === "buy" ? takerGetsAmount : takerPaysAmount;

  // note: immediateOrCancel and fillOrKill orders cannot enter the order book
  // so we can omit those flags here
  const specification = removeUndefined({
    direction,
    quantity,
    totalPrice,
    passive: (order.flags & orderFlags.Passive) !== 0 || undefined,
    // rippled currently does not provide "expiration" in account_offers
    expirationTime: parseTimestamp(order.expiration),
  });

  const makerExchangeRate = order.quality
    ? adjustQualityForXRP(
        order.quality.toString(),
        takerGetsAmount.currency,
        takerPaysAmount.currency
      )
    : computeQuality(takerGetsAmount, takerPaysAmount);
  const properties = {
    maker: address,
    sequence: order.seq,
    makerExchangeRate,
  };

  return { specification, properties };
}
