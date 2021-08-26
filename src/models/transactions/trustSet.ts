import { ValidationError } from "../../common/errors";
import { Amount } from "../common";

import {
  BaseTransaction,
  GlobalFlags,
  isAmount,
  verifyBaseTransaction,
} from "./common";

export enum TrustSetFlagsEnum {
  tfSetfAuth = 0x00010000,
  tfSetNoRipple = 0x00020000,
  tfClearNoRipple = 0x00040000,
  tfSetFreeze = 0x00100000,
  tfClearFreeze = 0x00200000,
}

export interface TrustSetFlags extends GlobalFlags {
  tfSetfAuth?: boolean;
  tfSetNoRipple?: boolean;
  tfClearNoRipple?: boolean;
  tfSetFreeze?: boolean;
  tfClearFreeze?: boolean;
}

export interface TrustSet extends BaseTransaction {
  TransactionType: "TrustSet";
  LimitAmount: Amount;
  QualityIn?: number;
  QualityOut?: number;
  Flags?: number | TrustSetFlags;
}

/**
 *
 * @param tx - A TrustSet Transaction.
 * @returns
 * @throws {ValidationError} When the TrustSet is malformed.
 */
export function verifyTrustSet(tx: TrustSet): void {
  verifyBaseTransaction(tx);
  const { LimitAmount, QualityIn, QualityOut } = tx;

  if (LimitAmount === undefined) {
    throw new ValidationError("TrustSet: missing field LimitAmount");
  }

  if (!isAmount(LimitAmount)) {
    throw new ValidationError("TrustSet: invalid LimitAmount");
  }

  if (QualityIn !== undefined && typeof QualityIn !== "number") {
    throw new ValidationError("TrustSet: QualityIn must be a number");
  }

  if (QualityOut !== undefined && typeof QualityOut !== "number") {
    throw new ValidationError("TrustSet: QualityOut must be a number");
  }
}
