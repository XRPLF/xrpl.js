import BigNumber from "bignumber.js";
import {
  xAddressToClassicAddress,
  isValidXAddress,
} from "ripple-address-codec";

import { Client } from "..";
import { ValidationError } from "../common/errors";
import { AccountInfoRequest, LedgerRequest } from "../models/methods";
import { Transaction } from "../models/transactions";
import { setTransactionFlagsToNumber } from "../models/utils";
import { xrpToDrops } from "../utils";

// 20 drops
const LEDGER_OFFSET = 20;
// 5 XRP
const ACCOUNT_DELETE_FEE = 5000000;

function scaleValue(value, multiplier, extra = 0): string {
  return new BigNumber(value).times(multiplier).plus(extra).toString();
}

export interface ClassicAccountAndTag {
  classicAccount: string;
  tag: number | false | undefined;
}

/**
 * Given an address (account), get the classic account and tag.
 * If an `expectedTag` is provided:
 * 1. If the `Account` is an X-address, validate that the tags match.
 * 2. If the `Account` is a classic address, return `expectedTag` as the tag.
 *
 * @param Account - The address to parse.
 * @param expectedTag - If provided, and the `Account` is an X-address,
 *                    this method throws an error if `expectedTag`
 *                    does not match the tag of the X-address.
 * @returns The classic account and tag.
 * @throws ValidationError when an address tag doesn't match the tag specificed in the transaction.
 */
function getClassicAccountAndTag(
  Account: string,
  expectedTag?: number
): ClassicAccountAndTag {
  if (isValidXAddress(Account)) {
    const classic = xAddressToClassicAddress(Account);
    if (expectedTag != null && classic.tag !== expectedTag) {
      throw new ValidationError(
        "address includes a tag that does not match the tag specified in the transaction"
      );
    }
    return {
      classicAccount: classic.classicAddress,
      tag: classic.tag,
    };
  }
  return {
    classicAccount: Account,
    tag: expectedTag,
  };
}

/**
 * Autofills fields in a transaction.
 *
 * @param client - A client.
 * @param tx - A transaction to autofill fields.
 * @param signersCount - A signers count used for multisign.
 * @returns An autofilled transaction.
 */
async function autofill(
  client: Client,
  tx: Transaction,
  signersCount?: number
): Promise<Transaction> {
  validateAccountAddress(tx, "Account", "SourceTag");
  // eslint-disable-next-line @typescript-eslint/dot-notation -- Destination can exist on Transaction
  if (tx["Destination"] != null) {
    validateAccountAddress(tx, "Destination", "DestinationTag");
  }

  // DepositPreauth:
  convertToClassicAddress(tx, "Authorize");
  convertToClassicAddress(tx, "Unauthorize");
  // EscrowCancel, EscrowFinish:
  convertToClassicAddress(tx, "Owner");
  // SetRegularKey:
  convertToClassicAddress(tx, "RegularKey");

  setTransactionFlagsToNumber(tx);

  const promises: Array<Promise<void>> = [];
  if (tx.Sequence == null) {
    promises.push(setNextValidSequenceNumber(client, tx));
  }
  if (tx.Fee == null) {
    promises.push(calculateFeePerTransactionType(client, tx, signersCount));
  }
  if (tx.LastLedgerSequence == null) {
    promises.push(setLatestValidatedLedgerSequence(client, tx));
  }

  return Promise.all(promises).then(() => tx);
}

function validateAccountAddress(
  tx: Transaction,
  accountField: string,
  tagField: string
): void {
  // if X-address is given, convert it to classic address
  const { classicAccount, tag } = getClassicAccountAndTag(tx[accountField]);
  tx[accountField] = classicAccount;

  if (tag !== null) {
    if (tx[tagField] && tx[tagField] !== tag) {
      throw new ValidationError(
        `The ${tagField}, if present, must match the tag of the ${accountField} X-address`
      );
    }
    tx[tagField] = tag;
  }
}

function convertToClassicAddress(tx: Transaction, fieldName: string): void {
  const account = tx[fieldName];
  if (typeof account === "string") {
    const { classicAccount } = getClassicAccountAndTag(account);
    tx[fieldName] = classicAccount;
  }
}

async function setNextValidSequenceNumber(
  client: Client,
  tx: Transaction
): Promise<void> {
  const request: AccountInfoRequest = {
    command: "account_info",
    account: tx.Account,
  };
  const data = await client.request(request);
  tx.Sequence = data.result.account_data.Sequence;
}

async function calculateFeePerTransactionType(
  client: Client,
  tx: Transaction,
  signersCount = 0
): Promise<void> {
  // netFee is usually 0.00001 XRP (10 drops)
  const netFeeXRP: string = await client.getFee();
  const netFeeDrops: string = xrpToDrops(netFeeXRP);
  let baseFee: BigNumber = new BigNumber(netFeeDrops);

  // EscrowFinish Transaction with Fulfillment
  if (tx.TransactionType === "EscrowFinish" && tx.Fulfillment != null) {
    const fulfillmentBytesSize: number = Math.ceil(tx.Fulfillment.length / 2);
    // 10 drops × (33 + (Fulfillment size in bytes / 16))
    const product = new BigNumber(
      scaleValue(netFeeDrops, 33 + fulfillmentBytesSize / 16)
    );
    baseFee = product.dp(0, BigNumber.ROUND_CEIL);
  }

  // AccountDelete Transaction
  if (tx.TransactionType === "AccountDelete") {
    baseFee = new BigNumber(ACCOUNT_DELETE_FEE);
  }

  // Multi-signed Transaction
  // 10 drops × (1 + Number of Signatures Provided)
  if (signersCount > 0) {
    baseFee = BigNumber.sum(baseFee, scaleValue(netFeeDrops, 1 + signersCount));
  }

  const maxFeeDrops = xrpToDrops(client._maxFeeXRP);
  const totalFee =
    tx.TransactionType === "AccountDelete"
      ? baseFee
      : BigNumber.min(baseFee, maxFeeDrops);

  // Round up baseFee and return it as a string
  tx.Fee = totalFee.dp(0, BigNumber.ROUND_CEIL).toString(10);
}

async function setLatestValidatedLedgerSequence(
  client: Client,
  tx: Transaction
): Promise<void> {
  const request: LedgerRequest = {
    command: "ledger",
    ledger_index: "validated",
  };
  const data = await client.request(request);
  const ledgerSequence = data.result.ledger_index;
  tx.LastLedgerSequence = ledgerSequence + LEDGER_OFFSET;
}

export default autofill;
