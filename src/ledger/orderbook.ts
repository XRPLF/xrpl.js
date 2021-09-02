import BigNumber from "bignumber.js";
import _ from "lodash";

import { Client } from "../client";
import { LedgerIndex } from "../models/common";
import {
  BookOffer,
  BookOffersRequest,
  BookOffersResponse,
  TakerAmount,
} from "../models/methods/bookOffers";

import { orderFlags } from "./parse/flags";

interface Orderbook {
  buy: BookOffer[];
  sell: BookOffer[];
}

async function getOrderbook(
  this: Client,
  taker_pays: TakerAmount,
  taker_gets: TakerAmount,
  limit?: number,
  ledger_index?: LedgerIndex,
  ledger_hash?: string,
  taker?: string
): Promise<Orderbook> {
  const request: BookOffersRequest = {
    command: "book_offers",
    taker_pays,
    taker_gets,
    ledger_index,
    ledger_hash,
    limit,
    taker,
  };
  // 2. Make Request
  const directOfferResults: BookOffersResponse[] = await this.requestAll(
    request
  );
  request.taker_gets = taker_pays;
  request.taker_pays = taker_gets;
  const reverseOfferResults: BookOffersResponse[] = await this.requestAll(
    request
  );
  // 3. Return Formatted Response
  const directOffers = _.flatMap(
    directOfferResults,
    (directOfferResult) => directOfferResult.result.offers
  );
  const reverseOffers = _.flatMap(
    reverseOfferResults,
    (reverseOfferResult) => reverseOfferResult.result.offers
  );
  // Sort the orders
  // for both bids and asks, lowest quality is closest to mid-market
  // we sort the orders so that earlier orders are closer to mid-market

  const orders = [...directOffers, ...reverseOffers].sort((a, b) => {
    const qualityA = a.quality ?? 0;
    const qualityB = b.quality ?? 0;

    return new BigNumber(qualityA).comparedTo(qualityB);
  });
  // separate out the orders amongst buy and sell
  const buy: BookOffer[] = [];
  const sell: BookOffer[] = [];
  orders.forEach((order) => {
    if (order.Flags === orderFlags.Sell) {
      sell.push(order);
    } else {
      buy.push(order);
    }
  });
  return { buy, sell };
}
export default getOrderbook;
