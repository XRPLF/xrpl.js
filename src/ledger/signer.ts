import { BigNumber } from "bignumber.js";
import { flatMap } from "lodash";
import { decodeAccountID } from "ripple-address-codec";
import {
  encode,
  decode,
  encodeForSigning,
  encodeForSigningClaim,
} from "ripple-binary-codec";
import {
  sign as signWithKeypair,
  verify as verifySignature,
} from "ripple-keypairs";

import { ValidationError } from "../common/errors";
import { SignedTransaction } from "../common/types/objects";
import { Signer } from "../models/common";
import { Transaction } from "../models/transactions";
import { verifyBaseTransaction } from "../models/transactions/common";
import { computeBinaryTransactionHash } from "../utils";
import Wallet from "../Wallet";

function sign(wallet: Wallet, tx: Transaction): SignedTransaction {
  return wallet.signTransaction(tx, { signAs: "" });
}

/**
 * The transactions should all be equal except for the 'Signers' field.
 *
 * @param transactions
 */
function validateTransactionEquivalence(transactions: Transaction[]) {
  const exampleTransaction = JSON.stringify({
    ...transactions[0],
    Signers: null,
  });
  if (
    transactions
      .slice(1)
      .some(
        (tx) => JSON.stringify({ ...tx, Signers: null }) !== exampleTransaction
      )
  ) {
    throw new ValidationError(
      "txJSON is not the same for all signedTransactions"
    );
  }
}

function addressToBigNumber(address) {
  const hex = Buffer.from(decodeAccountID(address)).toString("hex");
  return new BigNumber(hex, 16);
}

/**
 * If presented in binary form, the Signers array must be sorted based on
 * the numeric value of the signer addresses, with the lowest value first.
 * (If submitted as JSON, the submit_multisigned method handles this automatically.)
 * https://xrpl.org/multi-signing.html.
 *
 * @param a
 * @param b
 * @param a
 * @param b
 */
function compareSigners(a, b) {
  return addressToBigNumber(a.Account).comparedTo(
    addressToBigNumber(b.Account)
  );
}

function getTransactionWithAllSigners(
  transactions: Transaction[]
): Transaction {
  // flatMap let's us go from Transaction[] with Signer[] to one Signer[]
  const sortedSigners: { Signer: Signer }[] = flatMap(
    transactions,
    (tx) => tx.Signers?.map((signer) => signer.Signer) ?? []
  )
    .filter((signer) => signer)
    // Signers must be sorted - see compareSigners for more details
    .sort(compareSigners)
    .map((signer) => {
      return {
        Signer: signer,
      };
    });

  return { ...transactions[0], Signers: sortedSigners };
}

/**
 *
 * @param signedTransactions - A collection of the same transaction signed by different signers. The only difference
 * between the elements of signedTransactions should be the Signers field.
 * @returns An object with the combined transaction (now having a sorted list of all signers) which is encoded, along
 * with a transaction id based on the combined transaction.
 */
function combine(signedTransactions: string[]): SignedTransaction {
  const transactions: Transaction[] = signedTransactions.map((tx: string) => {
    return decode(tx);
  }) as unknown as Transaction[];

  transactions.forEach((tx) => verifyBaseTransaction(tx));
  validateTransactionEquivalence(transactions);

  const signedTransaction = encode(getTransactionWithAllSigners(transactions));
  return {
    signedTransaction,
    id: computeBinaryTransactionHash(signedTransaction),
  };
}

function getDecodedTransaction(txOrBlob: Transaction | string): Transaction {
  if (typeof txOrBlob === "object") {
    return txOrBlob;
  }

  return decode(txOrBlob) as unknown as Transaction;
}

function getEncodedTransaction(txOrBlob: Transaction | string): string {
  if (typeof txOrBlob === "object") {
    return encode(JSON.parse(JSON.stringify(txOrBlob)));
  }
  return txOrBlob;
}

function multisign(
  transactions: Array<Transaction | string>
): SignedTransaction {
  if (transactions.length === 0) {
    throw new ValidationError("There were 0 transactions given to multisign");
  }

  transactions.forEach((txOrBlob) => {
    const tx = getDecodedTransaction(txOrBlob);
    verifyBaseTransaction(tx);

    if (tx.SigningPubKey !== "") {
      throw new ValidationError(
        "For multisigning the transaction must include the SigningPubKey field as an empty string."
      );
    }

    if (tx.Signers === undefined) {
      throw new ValidationError(
        "For multisigning the transaction must include a Signers field containing an array of signatures."
      );
    }
  });

  const encodedTransactions: string[] = transactions.map((txOrBlob) =>
    getEncodedTransaction(txOrBlob)
  );

  return combine(encodedTransactions);
}

function authorizeChannel(
  wallet: Wallet,
  channelId: string,
  amount: string
): string {
  const signingData = encodeForSigningClaim({
    channel: channelId,
    amount,
  });

  return signWithKeypair(signingData, wallet.privateKey);
}

function verify(tx: Transaction | string): boolean {
  const decodedTx: Transaction = getDecodedTransaction(tx);
  return verifySignature(
    encodeForSigning(decodedTx),
    decodedTx.TxnSignature,
    decodedTx.SigningPubKey
  );
}

export { sign, multisign, authorizeChannel, verify };
