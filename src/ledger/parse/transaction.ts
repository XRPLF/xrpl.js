import { removeUndefined } from "../../utils";

import parseAccountDelete from "./account-delete";
import parseAmendment from "./amendment"; // pseudo-transaction
import parseOrderCancellation from "./cancellation";
import parseCheckCancel from "./check-cancel";
import parseCheckCash from "./check-cash";
import parseCheckCreate from "./check-create";
import parseDepositPreauth from "./deposit-preauth";
import parseEscrowCancellation from "./escrow-cancellation";
import parseEscrowCreation from "./escrow-creation";
import parseEscrowExecution from "./escrow-execution";
import parseFeeUpdate from "./fee-update"; // pseudo-transaction
import parseOrder from "./order";
import parsePayment from "./payment";
import parsePaymentChannelClaim from "./payment-channel-claim";
import parsePaymentChannelCreate from "./payment-channel-create";
import parsePaymentChannelFund from "./payment-channel-fund";
import parseSettings from "./settings";
import parseTicketCreate from "./ticket-create";
import parseTrustline from "./trustline";
import { parseOutcome } from "./utils";

function parseTransactionType(type) {
  // Ordering matches https://developers.ripple.com/transaction-types.html
  const mapping = {
    AccountSet: "settings",
    AccountDelete: "accountDelete",
    CheckCancel: "checkCancel",
    CheckCash: "checkCash",
    CheckCreate: "checkCreate",
    DepositPreauth: "depositPreauth",
    EscrowCancel: "escrowCancellation",
    EscrowCreate: "escrowCreation",
    EscrowFinish: "escrowExecution",
    OfferCancel: "orderCancellation",
    OfferCreate: "order",
    Payment: "payment",
    PaymentChannelClaim: "paymentChannelClaim",
    PaymentChannelCreate: "paymentChannelCreate",
    PaymentChannelFund: "paymentChannelFund",
    SetRegularKey: "settings",
    SignerListSet: "settings",
    TicketCreate: "ticketCreate",
    TrustSet: "trustline",

    EnableAmendment: "amendment", // pseudo-transaction
    SetFee: "feeUpdate", // pseudo-transaction
  };
  return mapping[type] || null;
}

// includeRawTransaction: undefined by default (getTransaction)
function parseTransaction(tx: any, includeRawTransaction: boolean): any {
  const type = parseTransactionType(tx.TransactionType);
  const mapping = {
    settings: parseSettings,
    accountDelete: parseAccountDelete,
    checkCancel: parseCheckCancel,
    checkCash: parseCheckCash,
    checkCreate: parseCheckCreate,
    depositPreauth: parseDepositPreauth,
    escrowCancellation: parseEscrowCancellation,
    escrowCreation: parseEscrowCreation,
    escrowExecution: parseEscrowExecution,
    orderCancellation: parseOrderCancellation,
    order: parseOrder,
    payment: parsePayment,
    paymentChannelClaim: parsePaymentChannelClaim,
    paymentChannelCreate: parsePaymentChannelCreate,
    paymentChannelFund: parsePaymentChannelFund,
    ticketCreate: parseTicketCreate,
    trustline: parseTrustline,

    amendment: parseAmendment, // pseudo-transaction
    feeUpdate: parseFeeUpdate, // pseudo-transaction
  };
  const parser: Function = mapping[type];

  const specification = parser
    ? parser(tx)
    : {
        UNAVAILABLE: "Unrecognized transaction type.",
        SEE_RAW_TRANSACTION:
          "Since this type is unrecognized, `rawTransaction` is included in this response.",
      };
  if (!parser) {
    includeRawTransaction = true;
  }

  const outcome = parseOutcome(tx);
  return removeUndefined({
    type,
    address: tx.Account,
    sequence: tx.Sequence,
    id: tx.hash,
    specification: removeUndefined(specification),
    outcome: outcome ? removeUndefined(outcome) : undefined,
    rawTransaction: includeRawTransaction ? JSON.stringify(tx) : undefined,
  });
}

export default parseTransaction;
