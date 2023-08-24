import * as keypairs from "ripple-keypairs";

import * as utils from "../utils";

/* Types ==================================================================== */

// eslint-disable-next-line import/no-unused-modules -- it is returned by Account.getKeypair
export interface Keypair {
  publicKey: string;
  privateKey: string;
}

interface AccountData {
  familySeed: string;
  address: string;
  keypair: Keypair;
}

/* Class ==================================================================== */

export default class Account {
  private readonly _secret: string[];
  private readonly _account: AccountData = {
    familySeed: "",
    address: "",
    keypair: {
      publicKey: "",
      privateKey: "",
    },
  };

  constructor(secretNumbers?: string[] | string | Buffer) {
    if (typeof secretNumbers === "string") {
      this._secret = utils.parseSecretString(secretNumbers);
    } else if (Array.isArray(secretNumbers)) {
      this._secret = secretNumbers;
    } else if (Buffer.isBuffer(secretNumbers)) {
      this._secret = utils.entropyToSecret(secretNumbers);
    } else {
      this._secret = utils.randomSecret();
    }

    validateLengths(this._secret);
    this.derive();
  }

  getSecret(): string[] {
    return this._secret;
  }

  getSecretString(): string {
    return this._secret.join(" ");
  }

  getAddress(): string {
    return this._account.address;
  }

  getFamilySeed(): string {
    return this._account.familySeed;
  }

  getKeypair(): Keypair {
    return this._account.keypair;
  }

  toString(): string {
    return this.getSecretString();
  }

  private derive(): void {
    try {
      const entropy = utils.secretToEntropy(this._secret);
      this._account.familySeed = keypairs.generateSeed({ entropy });
      this._account.keypair = keypairs.deriveKeypair(this._account.familySeed);
      this._account.address = keypairs.deriveAddress(
        this._account.keypair.publicKey
      );
    } catch (error) {
      let message = "Unknown Error";
      if (error instanceof Error) {
        message = error.message;
      }
      // we'll proceed, but let's report it
      throw new Error(message);
    }
  }
}

function validateLengths(secretNumbers: string[]): void {
  if (secretNumbers.length !== 8) {
    throw new Error("Secret must have 8 numbers");
  }
  secretNumbers.forEach((num) => {
    if (num.length !== 6) {
      throw new Error("Each secret number must be 6 digits");
    }
  });
}
