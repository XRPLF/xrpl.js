import * as assert from "assert";

import BigNumber from "bignumber.js";

import type { Client } from "..";
import { FormattedSettings, WeightedSigner } from "../common/types/objects";

import {
  Instructions,
  Prepare,
  SettingsTransaction,
  TransactionJSON,
} from "./types";
import * as utils from "./utils";

const AccountSetFlags = utils.common.constants.AccountSetFlags;
const AccountFields = utils.common.constants.AccountFields;

function setTransactionFlags(
  txJSON: TransactionJSON,
  values: FormattedSettings
) {
  const keys = Object.keys(values).filter(
    (key) => AccountSetFlags[key] != null
  );
  assert.ok(
    keys.length <= 1,
    "ERROR: can only set one setting per transaction"
  );
  const flagName = keys[0];
  const value = values[flagName];
  const index = AccountSetFlags[flagName];
  if (index != null) {
    if (value) {
      txJSON.SetFlag = index;
    } else {
      txJSON.ClearFlag = index;
    }
  }
}

// Sets `null` fields to their `default`.
function setTransactionFields(
  txJSON: TransactionJSON,
  input: FormattedSettings
) {
  const fieldSchema = AccountFields;
  for (const fieldName in fieldSchema) {
    const field = fieldSchema[fieldName];
    let value = input[field.name];

    if (value === undefined) {
      continue;
    }

    // The value required to clear an account root field varies
    if (value === null && field.hasOwnProperty("defaults")) {
      value = field.defaults;
    }

    if (field.encoding === "hex" && !field.length) {
      // This is currently only used for Domain field
      value = Buffer.from(value, "ascii").toString("hex").toUpperCase();
    }

    txJSON[fieldName] = value;
  }
}

/**
 *  Note: A fee of 1% requires 101% of the destination to be sent for the
 *        destination to receive 100%.
 *  The transfer rate is specified as the input amount as fraction of 1.
 *  To specify the default rate of 0%, a 100% input amount, specify 1.
 *  To specify a rate of 1%, a 101% input amount, specify 1.01.
 *
 *  @param {Number|String} transferRate
 *
 *  @returns {Number|String} Numbers will be converted while strings
 *                           are returned.
 */

function convertTransferRate(transferRate: number): number {
  return new BigNumber(transferRate).shiftedBy(9).toNumber();
}

function formatSignerEntry(signer: WeightedSigner): object {
  return {
    SignerEntry: {
      Account: signer.address,
      SignerWeight: signer.weight,
    },
  };
}

function createSettingsTransactionWithoutMemos(
  account: string,
  settings: FormattedSettings
): SettingsTransaction {
  if (settings.regularKey !== undefined) {
    const removeRegularKey = {
      TransactionType: "SetRegularKey",
      Account: account,
    };
    if (settings.regularKey === null) {
      return removeRegularKey;
    }
    return { ...removeRegularKey, RegularKey: settings.regularKey };
  }

  if (settings.signers != null) {
    const setSignerList: SettingsTransaction = {
      TransactionType: "SignerListSet",
      Account: account,
      SignerEntries: [],
      SignerQuorum: settings.signers.threshold,
    };

    if (settings.signers.weights != null) {
      setSignerList.SignerEntries =
        settings.signers.weights.map(formatSignerEntry);
    }
    return setSignerList;
  }

  const txJSON: SettingsTransaction = {
    TransactionType: "AccountSet",
    Account: account,
  };

  const settingsWithoutMemos = { ...settings };
  delete settingsWithoutMemos.memos;
  setTransactionFlags(txJSON, settingsWithoutMemos);
  setTransactionFields(txJSON, settings); // Sets `null` fields to their `default`.

  if (txJSON.TransferRate != null) {
    txJSON.TransferRate = convertTransferRate(txJSON.TransferRate);
  }
  return txJSON;
}

function createSettingsTransaction(
  account: string,
  settings: FormattedSettings
): SettingsTransaction {
  const txJSON = createSettingsTransactionWithoutMemos(account, settings);
  if (settings.memos != null) {
    txJSON.Memos = settings.memos.map(utils.convertMemo);
  }
  return txJSON;
}

async function prepareSettings(
  this: Client,
  address: string,
  settings: FormattedSettings,
  instructions: Instructions = {}
): Promise<Prepare> {
  try {
    const txJSON = createSettingsTransaction(address, settings);

    return await utils.prepareTransaction(txJSON, this, instructions);
  } catch (e) {
    return Promise.reject(e);
  }
}

export default prepareSettings;
